const { Server } = require("socket.io");
const dizzbaseConnection = require ('./dizzbaseConnection');
const dbListener = require ('../dbListener/dbListener');
const dbTools = require ('../dbTools/dbTools');
const test = require ('../test/testquery');

async function initDizzbaseServer(server) {
    await dbTools.InitDB();
    dbListener.initDBListener();

    const io = new Server(server, {
        cors: {
          origin: true,
          methods: ["GET", "POST"]
        }
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
}

module.exports = { initDizzbaseServer };
