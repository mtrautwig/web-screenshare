const express = require('express');
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
        if (typeof(message) == 'string') {
            var msg = JSON.parse(message);
            if ('hello' == msg.command) {
                ws.send(message);
                return; // heartbeat
            }
        }

        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on("close", function() {
        sendPeers(wss);
    });

    sendPeers(wss);
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});

function sendPeers(server) {
    let clients = server.clients.size;
    server.clients.forEach(client => {
        client.send(JSON.stringify({
            "command": "hello",
            "data": clients
        }));
    });
}