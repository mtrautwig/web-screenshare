(function() {

    function Socket() {
        console.log('Connecting');
        var ws = new WebSocket(window.location.href.replace(/^http/, "ws"));
        var handlers = {};

        ws.onopen = function(event) {
            console.log('WS connection opened', JSON.stringify(event));
        };

        ws.onerror = function(event) {
            console.log('WS connection failed', JSON.stringify(event));
        }

        ws.onmessage = function(event) {
            if ("string" == typeof event.data) {
                var message = JSON.parse(event.data);
                if (handlers[message.command]) {
                    handlers[message.command]([message.data]);
                    return;
                }
            } else if (event.data instanceof Blob) {
                if (handlers['binary']) {
                    handlers['binary'](event.data);
                    return;
                }
            }
            console.log("Unhandled:", event);
        };

        this.emit = function(command, data) {
            ws.send(JSON.stringify({command: command, data: data}));
        };

        this.binary = function(data) {
            ws.send(data);
        };

        this.on = function(command, handler) {
            handlers[command] = handler;
        };
    }

    function MediaDisplay() {
        var clockTimer = null;

        var clear = function() {
            if (clockTimer) {
                window.clearTimeout(clockTimer);
                clockTimer = null;
            }

            var displayEl = document.getElementById('display');
            while (displayEl.children.length) {
                displayEl.removeChild(displayEl.children[0]);
            }            
            return displayEl;
        };

        var updateClock = function() {
            //var days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
            var days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            var months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

            var clock = document.querySelector('#clock');
            if (clock) {
                var now = new Date();

                var clockTime = clock.querySelector('#clock-time');
                var hr = now.getHours();
                var min = now.getMinutes();        
                clockTime.textContent = "" + Math.floor(hr / 10) + Math.floor(hr % 10) + ":" + Math.floor(min / 10) + Math.floor(min % 10);

                var clockDate = clock.querySelector('#clock-date');
                var date = now.getDate();
                clockDate.textContent = days[now.getDay()] + ", " + Math.floor(date / 10) + Math.floor(date % 10) + ". " + 
                    months[now.getMonth()] + " " + now.getFullYear();
            }
        };

        this.clear = function() {
            clear();
        }

        this.viewClock = function() {
            var displayEl = clear();
            var tpl = document.querySelector('#clock-template');
            var clockEl = document.importNode(tpl.content, true);
            displayEl.appendChild(clockEl);

            updateClock();
            clockTimer = window.setInterval(updateClock, 10000);
        };

        this.viewImage = function(data) {
            var displayEl = clear();
            var imgEl = document.createElement('img');
            imgEl.src = window.URL.createObjectURL(new Blob([data]));
            imgEl.onload = (ev) => {
                window.URL.revokeObjectURL(ev.target.src);
            };
            displayEl.appendChild(imgEl);
        };

        this.viewHtml = function(data) {
            var displayEl = clear();
            var iframeEl = document.createElement('iframe');
            iframeEl.srcdoc = '<html><body>' + data + '</body></html>';
            displayEl.appendChild(iframeEl);
        };

        this.viewUrl = function(url) {
            var displayEl = clear();
            var iframeEl = document.createElement('iframe');
            iframeEl.src = url;
            displayEl.appendChild(iframeEl);
        };

        this.showConnected = function(count) {
            document.querySelector('#num-screens').textContent = count;
        };
    }

    function MediaBroadcast(display) {
        var socket = new Socket();

        this.clear = function() {
            display.clear();
            socket.emit('clear', {});
        };

        this.viewClock = function() {
            display.viewClock();
            socket.emit('clock', {});
        };

        this.viewImage = function(data) {
            display.viewImage(data);
            socket.binary(data);
        };

        this.viewHtml = function(data) {
            display.viewHtml(data);
            socket.emit('html', data);
        };

        this.viewUrl = function(url) {
            display.viewUrl(url);
            socket.emit('url', url);
        };

        this.listen = function() {
            socket.on('hello', (params) => {
                console.log('Peers connected:', params);
                display.showConnected(params);
            });
            socket.on('binary', (data) => {
                display.viewImage(data);
            });
            socket.on('clock', () => {
                display.viewClock();
            });
            socket.on('html', (data) => {
                display.viewHtml(data);
            });
            socket.on('url', (url) => {
                display.viewUrl(url);
            });
        };
    }

    console.log('script started');

    var screen = new MediaDisplay();
    screen.viewClock();

    var broadcast = new MediaBroadcast(screen);
    broadcast.listen();
    
    var toolbar = document.querySelector('#toolbar');
    document.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        toolbar.classList.add('dragging');
    });
    document.addEventListener('dragleave', (event) => {
        event.preventDefault();
        toolbar.classList.remove('dragging');
    });
    document.addEventListener('drop', (event) => {
        event.preventDefault();
        toolbar.classList.remove('dragging');

        var files = event.dataTransfer.files;
        if (files.length) {
            acceptFile(files[0]);
        }
    });

    document.addEventListener('paste', (event) => {
        var files = event.clipboardData.files;
        if (files.length) {
            acceptFile(files[0]);
        } else {
            var text = event.clipboardData.getData('text/plain');
            if (text && (text.indexOf('http:') == 0 || text.indexOf('https:') == 0)) {
                broadcast.viewUrl(text);
            }
        }
    });

    function acceptFile(file) {
        var reader = new FileReader();
        if (file.type.indexOf('image/') == 0) {
            reader.onloadend = (ev) => {
                var data = ev.target.result;
                broadcast.viewImage(data);
            };
            reader.readAsArrayBuffer(file);
        } else if ("text/html" == file.type) {
            reader.onloadend = (ev) => {
                var data = ev.target.result;
                broadcast.viewHtml(data);
            };
            reader.readAsText(file);            
        } else {
            console.log('Unsupported file:', file);
        }
    }
    
    document.querySelector('#btn-clock').addEventListener('click', () => {
       broadcast.viewClock();
    });
})();

