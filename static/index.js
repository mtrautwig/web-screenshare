(function() {

    function Socket() {        
        const ws = new WebSocket(window.location.href.replace(/^http/, "ws"));

        ws.onopen = function() {
            ws.send('hello');
        };

        ws.onmessage = function(event) {
            if ("string" == typeof event.data) {
                let message = JSON.parse(event.data);
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
        const codec = "video/webm;codecs=vp8";
        let self = this;
        let socket = new Socket();

        if (!MediaRecorder.isTypeSupported(codec)) {
            console.error(codec, 'codec not supported');
        }

        this.share = function() {
            navigator.mediaDevices.getDisplayMedia().then(stream => {
                console.log(stream);

                let recorder = new MediaRecorder(stream, {
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

            let source = new MediaSource();
            source.addEventListener('sourceopen', () => {
                console.log('Source open', params);
                let mimeType = codec;
                if (params && params.mimeType) {
                    mimeType = params.mimeType;
                }

                let buffer = source.addSourceBuffer(mimeType);
                /*socket.on('data', (arrayBuffer) => {
                    //console.log('RECV', arrayBuffer);
                    buffer.appendBuffer(arrayBuffer);
                });*/
            });

            let video = document.querySelector("video");
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

    const screen = new SharedScreen();
    document.querySelector("#start-share").addEventListener("click", () => {
        screen.share();
    });

    screen.listen();

}());

