const express = require('express');
const fs = require('fs');

const app = express();
const http = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({
    server: http
});

app.use(express.static('static'));

wss.on('connection', function(ws) {
    console.log('a user connected');

    ws.on('message', function(message) {
        console.log('received: %s', message);
    });

    ws.on("close", function() {
        sendPeers(wss);
    });

    ws.send(new ArrayBuffer());
    sendPeers(wss);
});

/*
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
*/

http.listen(3000, function() {
    console.log('listening on *:3000');
});

function sendPeers(server) {
    let clients = server.clients.size;
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                "command": "hello",
                "clients": clients
            }));
        }
    });
}