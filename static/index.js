(function() {

    function Socket() {        
        var ws = new WebSocket(window.location.href.replace(/^http/, "ws"));

        ws.onopen = function(event) {
            console.log('WS connection opened', JSON.stringify(event));
            ws.send('hello');
        };

        ws.onerror = function(event) {
            console.log('WS connection failed', JSON.stringify(event));
        }

        ws.onmessage = function(event) {
            if ("string" == typeof event.data) {
                var message = JSON.parse(event.data);
                if ("hello" == message.command) {
                    console.log("Clients connected:", message.clients);
                }
            } else if (event.data instanceof Blob) {
                // TODO
            } else {
                console.log("Unhandled:", event);
            }
        };

        this.emit = function() {
            // TODO
        };

        this.on = function() {
            // TODO
        };
    }

    function SharedScreen() {
        var codec = "video/webm;codecs=vp8";
        var self = this;
        var socket = new Socket();

        if (!MediaRecorder.isTypeSupported(codec)) {
            console.error(codec, 'codec not supported');
        }

        this.share = function() {
            navigator.mediaDevices.getDisplayMedia().then(stream => {
                console.log(stream);

                var recorder = new MediaRecorder(stream, {
                    mimeType: codec
                });
                recorder.ondataavailable = function(event) {
                    if (event.data.size > 0) {
                        //socket.emit('data', event.data);
                    }
                };
                recorder.onstart = function() {
                    console.log('Recording started', recorder, stream.getTracks());
                    //socket.emit('view', { mimeType: codec });
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
            //socket.off('data');
            document.body.classList.add('playing');

            var source = new MediaSource();
            source.addEventListener('sourceopen', () => {
                console.log('Source open', params);
                var mimeType = codec;
                if (params && params.mimeType) {
                    mimeType = params.mimeType;
                }

                var buffer = source.addSourceBuffer(mimeType);
                /*socket.on('data', (arrayBuffer) => {
                    //console.log('RECV', arrayBuffer);
                    buffer.appendBuffer(arrayBuffer);
                });*/
            });

            var video = document.querySelector("video");
            video.src = URL.createObjectURL(source);
            video.addEventListener("loadedmetadata", () => {
                console.log('Video ready');
                URL.revokeObjectURL(video.src);
            });
            video.play();
        };

        this.listen = function() {
            /*socket.on('hello', (params) => {
                console.log('Peer connected', params);
            });*/
            /*socket.on('view', (params) => {
                self.view(params);
            });*/
        };
    }

    var screen = new SharedScreen();
    document.querySelector("#start-share").addEventListener("click", () => {
        screen.share();
    });

    screen.listen();

}());

