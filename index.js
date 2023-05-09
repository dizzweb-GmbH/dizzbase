const { Console } = require('console');
const dizzbaseServer = require ('./dizzbaseServer/dizzbaseServer');

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

app.get('/', (req, res) => {
    res.send ("Hello, world!");
});

// This block ensures proper initialization order - start the TCP listener after everything has been initialized:
(async () => {
    // Start the dizzbase Socket.io server and initialize
    await dizzbaseServer.initDizzbaseServer(server);
   
    // do not move out of this async block to ensure everything is initialized properly
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });    
})()
