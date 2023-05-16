const { Server } = require("socket.io");
const dizzbaseConnection = require ('./dizzbaseConnection');
const dbListener = require ('../dbListener/dbListener');
const dizzbaseAuthentication = require ('./dizzbaseAuthentication');
const dbTools = require ('../dbTools/dbTools');

const socketioJwt = require('socketio-jwt');
var sockets = {};

async function initDizzbaseExpressServer(server) {
    await dbTools.InitDB();
    console.log ("Database connection initialized.")
    dbListener.initDBListener();

    const io = new Server(server, {
        cors: {
          origin: true,
          methods: ["GET", "POST"]
        }
    });

    //setInterval(auditSockets, 1000);

    io.on('connection', function (socket) {
        var socketUuid = crypto.randomUUID();
        connectionsOfSocket = {};
        sockets[socketUuid] = connectionsOfSocket;

        function getConnection(fromClientPacket)
        {
            var c = connectionsOfSocket[fromClientPacket.uuid]
            if (c == null)
            {
                c = dizzbaseConnection.initConnection (fromClientPacket.uuid, fromClientPacket.nickName, socket);
                connectionsOfSocket[fromClientPacket.uuid]=c;
            }
            return c;
        }

        console.log('Client has connected.');

        socket.on('close', (_uuid) => {
            // TODO Close connection

        });
    
        socket.on('dbrequest', (fromClientPacket) => {
            var connection = getConnection (fromClientPacket);
            connection.dbRequestEvent (fromClientPacket);
        });
    
        socket.on('dizzbase_login', (req) => {
            dizzbaseAuthentication.dizzbaseLogin(req, socket);
        });
    
        socket.on('disconnect', async (reason) => {
            // TODO Close connection
            console.log ("Client disconnect - "+reason);
            for (var prop in connectionsOfSocket) {
                if (Object.prototype.hasOwnProperty.call(connectionsOfSocket, prop)) {
                    connectionsOfSocket[prop].dispose();
                    delete connectionsOfSocket[prop];
                }
            }            
            delete sockets[socketUuid];
        });
    });
}

function auditSockets() {
    console.log("");
    console.log ("*** Socket/Connection/Query Audit starting ***");
    var found = false;
    for (var prop in sockets) {
        if (Object.prototype.hasOwnProperty.call(sockets, prop)) {
            found=true;
            console.log ("Active Socket: "+prop);    
            let connections = sockets[prop];
            for (var prop_c in connections) {
                if (Object.prototype.hasOwnProperty.call(connections, prop_c)) {
                    connections[prop_c].audit();
                }
            }
        }
    }
    if (found==false) console.log ("No active sockets found.");
    console.log("");
}

module.exports = { initDizzbaseExpressServer, auditSockets};
