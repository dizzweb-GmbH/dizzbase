const dbListener = require ('./dbListener/dbListener');

function helloWorld(string) {
    return string === "HelloWorld"
}

module.exports = helloWorld

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"]
    }
  });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.send ("hello, world!");
    console.log('a user connected');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

// Start dblistener
dbListener.initDBListener();
