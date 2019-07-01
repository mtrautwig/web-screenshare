const express = require('express');
const fs = require('fs');
const openssl = require('openssl');

(async () => {
    if (!fs.existsSync('key.pem')) {
        await createPrivateKey();
    }
    if (!fs.existsSync('cert.pem')) {
        await createCertificate();
    }
    startServer();
})();

function createPrivateKey() {
    return new Promise((resolve) => {
        openssl('genrsa', {'out': 'key.pem'}, (exit, stdout, stderr) => {
            resolve();
        });    
    });
}

function createCertificate() {
    return new Promise((resolve) => {
        let host = 'localhost';
        openssl('req', {'out': 'cert.pem', 'key': 'key.pem', 'subj': `/CN=${host}/`, 'days': '+365'}, ['-new', '-x509'], (exit, stdout, stderr) => {
            resolve();
        });    
    });
}

function startServer() {
    const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
    
    const app = express();
    const http = require('https').createServer(options, app);
    const io = require('socket.io')(http);

    app.use(express.static('static'));

    io.on('connection', function(socket) {
        console.log('a user connected');
        sendPeers(socket);
        socket.on('disconnect', function() {
            sendPeers(socket);
        });
        socket.on('view', function(params) {
            socket.broadcast.emit('view', params);
        });
        socket.on('data', function(blob) {
            socket.broadcast.emit('data', blob);
        });
    });

    http.listen(3000, function(){
    console.log('listening on *:3000');
    });
}

function sendPeers(socket) {
    io.sockets.clients((err, clients) => {
        io.sockets.emit('hello', clients);
    });
}