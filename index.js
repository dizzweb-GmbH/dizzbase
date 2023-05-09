const { Console } = require('console');
const dbListener = require ('./dbListener/dbListener');
const dbTools = require ('./dbTools/dbTools');
const dizzbaseConnection = require ('./dizzbaseConnection/dizzbaseConnection');
const test = require ('./test/testquery');
const PubSub = require('pubsub-js');

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
    var uuidList = [];

    socket.on('init', (_uuid) => {
        uuidList.push (_uuid, socket);
        dizzbaseConnection.initConnection (_uuid, socket);
    });

    socket.on('close', (_uuid) => {
        let _temp_uuidList = [];
        _temp_uuidList.push (_uuid);
        dizzbaseConnection.closeConnections (_temp_uuidList);
    });

    socket.on('dbrequest', (req) => {
        dizzbaseConnection.dbRequestEvent (req, socket);
    });

    socket.on('disconnect', async (reason) => {
        dizzbaseConnection.closeConnections (uuidList);
        uuidList = [];
        console.log ("Client disconnect - "+reason);
    });
});

// create a function to subscribe to topics
var mySubscriber = function (msg, data) {
    console.log( msg, data );
};

var token = PubSub.subscribe('db_change', mySubscriber);


// This block ensures proper initialization order
(async () => {
    await dbTools.InitDB();

    //test.runTestQuery();
    dbListener.initDBListener();
    
    // do not move out of this async block to ensure everything is initialized properly
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });    
})()
