const dbListener = require ('./dbListener/dbListener');
const dbTools = require ('./dbTools/dbTools');

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

io.on('connection', function (socket) {
    //socket.send ("message", "message1");
    //socket.emit ("message", "message2");
    console.log('Client has connected');

    socket.on('query', (q) => {
        console.log('Query: ' + q);
    });
});

dbListener.initDBListener();


// This block ensures proper initialization order
(async () => {
    await dbTools.InitDB();

    // do not move out of this async block to ensure everything is initialized properly
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });    
})()




