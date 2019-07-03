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

    function MediaBroadcast() {
        var self = this;
        var socket = new Socket();

        this.send = function(data) {
            socket.binary(data);
        };

        this.view = function(data) {
            var displayEl = document.getElementById('display');
            while (displayEl.children.length) {
                displayEl.removeChild(displayEl.children[0]);
            }            
            var imgEl = document.createElement('img');
            imgEl.src = window.URL.createObjectURL(new Blob([data]));
            displayEl.appendChild(imgEl);
        };

        this.listen = function() {
            socket.on('hello', (params) => {
                console.log('Peers connected:', params);
            });
            socket.on('binary', (data) => {
                self.view(data);
            });
        };
    }

    console.log('script started');

    var screen = new MediaBroadcast();
    screen.listen();
    
    var overlay = document.querySelector('#overlay');
    overlay.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        event.target.classList.add('dragging');
    });
    overlay.addEventListener('dragleave', (event) => {
        event.target.classList.remove('dragging');
    });
    overlay.addEventListener('drop', (event) => {
        event.target.classList.remove('dragging');

        event.preventDefault();
        var files = event.dataTransfer.files;
        if (files.length) {
            acceptFile(files[0]);
        }
    });

    document.addEventListener('paste', (event) => {
        var files = event.clipboardData.files;
        if (files.length) {
            acceptFile(files[0]);
        }
    });

    function acceptFile(file) {
        var reader = new FileReader();
        reader.onloadend = (ev) => {
            var data = ev.target.result;
            screen.view(data);
            screen.send(data);
        };
        reader.readAsArrayBuffer(file);
    }

})();

