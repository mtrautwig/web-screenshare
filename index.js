const express = require('express');
const fs = require('fs');

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

function sendPeers(socket) {
    io.sockets.clients((err, clients) => {
        io.sockets.emit('hello', clients);
    });
}