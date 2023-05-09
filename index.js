const { Console } = require('console');
const dbListener = require ('./dbListener/dbListener');
const dbTools = require ('./dbTools/dbTools');
const dizzbaseConnection = require ('./dizzbaseConnection/dizzbaseConnection');
const test = require ('./test/testquery');

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
    console.log('Client has connected');
    var connection;
    var random = Math.floor(Math.random() * 1000);;

    socket.on('query', async (q) => {
        connection = new dizzbaseConnection.dizzbaseConnection(q);
        res = await connection.runQuery();
        socket.emit ('data', res);
    });
    socket.on('disconnect', async (reason) => {
        console.log ("Client ("+random.toString()+") disconnect - "+reason);
    });
});

dbListener.initDBListener();


// This block ensures proper initialization order
(async () => {
    await dbTools.InitDB();

    //test.runTestQuery();
    
    // do not move out of this async block to ensure everything is initialized properly
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });    
})()
