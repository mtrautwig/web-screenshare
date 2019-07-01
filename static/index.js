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

    function SharedScreen() {
        var self = this;
        var codec = "video/webm;codecs=vp8";
        var socket = new Socket();

        this.share = function() {
            if (!MediaRecorder) {
                console.error(codec, 'MediaRecorder not supported');
            }
            if (!MediaRecorder.isTypeSupported(codec)) {
                console.error(codec, 'codec not supported');
            }
            navigator.mediaDevices.getDisplayMedia().then(stream => {
                console.log(stream);

                var recorder = new MediaRecorder(stream, {
                    mimeType: codec
                });
                recorder.ondataavailable = function(event) {
                    if (event.data.size > 0) {
                        socket.binary(event.data);
                    }
                };
                recorder.onstart = function() {
                    console.log('Recording started', recorder, stream.getTracks());
                    socket.emit('view', { mimeType: codec });
                };
                recorder.onstop = function() {
                    console.log('Recording stopped');
                };
                recorder.onwarning = function(event) {
                    console.log(event);
                };
                recorder.onpause = function(event) {
                    console.log(event);
                };

                stream.oninactive = function() {
                    recorder.stop();
                };

                recorder.start(200);
                window.recorder = recorder;
            });    
        };

        this.view = function(params) {
            console.log('Starting to play');
            document.body.classList.add('playing');

            var source = new MediaSource();
            source.addEventListener('sourceopen', () => {
                console.log('Source open', params);
                var mimeType = codec;
                if (params && params.mimeType) {
                    mimeType = params.mimeType;
                }

                var buffer = source.addSourceBuffer(mimeType);
                socket.on('binary', (blob) => {
                    //console.log('RECV', blob);
                    var reader = new FileReader();
                    reader.addEventListener('loadend', (event) => {
                        buffer.appendBuffer(event.target.result);
                    });
                    reader.readAsArrayBuffer(blob);
                });
            });

            var video = document.querySelector("video");
            var onloaded = () => {
                console.log('Video ready');
                video.removeEventListener("loadedmetadata", onloaded);
                //URL.revokeObjectURL(video.src);
                video.play();
            };

            video.src = URL.createObjectURL(source);            
            video.addEventListener("loadedmetadata", onloaded);
        };

        this.listen = function() {
            socket.on('hello', (params) => {
                console.log('Peers connected:', params);
            });
            socket.on('view', (params) => {
                self.view(params);
            });
        };
    }

    console.log('script started');

    var screen = new SharedScreen();
    document.querySelector("#start-share").addEventListener("click", () => {
        screen.share();
    });

    screen.listen();

})();

