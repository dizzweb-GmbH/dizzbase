const { Server } = require("socket.io");
const dizzbaseConnection = require ('./dizzbaseConnection');
const dbListener = require ('../dbListener/dbListener');
const dizzbaseAuthentication = require ('./dizzbaseAuthentication');
const dbTools = require ('../dbTools/dbTools');
const jwt = require('jsonwebtoken');
require('dotenv').config();

var sockets = {};

function getConnection(socketuuid, fromClientPacket, socket)
{
    var c = sockets[socketuuid][fromClientPacket.uuid];
    if (c == null)
    {
        c = dizzbaseConnection.initConnection (fromClientPacket.uuid, fromClientPacket.nickName, socket);
        sockets[socketuuid]['connections'][fromClientPacket.uuid] = c;
    }
    return c;
}

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
        console.log('Client has connected.');
        // Init the sockets record
        var socketUuid = "";

        socket.on ('dizzbase_socket_init', (req) => {
            let _socketuuid = req["socketuuid"];
            let _uuid = req["data"];
            sockets[_socketuuid] = {connections: [], logins: []};
            socketUuid = _socketuuid;
        })

        socket.on('close_connection', (req) => {
            let _socketuuid = req["socketuuid"];
            let _uuid = req["data"];

            sockets[_socketuuid]['connections'][_uuid].dispose();
            delete sockets[_socketuuid]['connections'][_uuid];
        });
    
        socket.on('dbrequest', (req) => {
            if (process.env.JWT_SECRET != null) 
            {
                var decoded;
                var tokenError = "";
                try  {decoded = jwt.verify (req.token, process.env.JWT_SECRET)}
                catch (err) {
                    tokenError = err.toString();
                }
                if (tokenError != "")
                {
                    socket.emit ('dbrequest_response', {"jwtError": tokenError});
                    return;
                }
                if (decoded.user_role == "api")
                {
                    socket.emit ('dbrequest_response', {"jwtError": "apiAccessToken does not have access to database requests. Please log in first."});
                    return;
                }
            }
            let _socketuuid = req["socketuuid"];
            let fromClientPacket = req["data"];
            var connection = getConnection (_socketuuid, fromClientPacket, socket);
            connection.dbRequestEvent (fromClientPacket);
        });
    
        socket.on('dizzbase_auth_request', async (req) => {
            var returnTokenError = "";
            if (process.env.JWT_SECRET != null) 
            {
               var decoded;
                try  {decoded = jwt.verify (req.token, process.env.JWT_SECRET)}
                catch (err) {
                    returnTokenError = err.toString();
                }
            }
            let _socketuuid = req["socketuuid"];
            let authReq = req["data"];
            result = await dizzbaseAuthentication.dizzbaseAuthRequest(authReq, socket, returnTokenError);
            if (result.error == "")
            {
                if (authReq["authRequestType"] == 'login') {
                    sockets[_socketuuid]['logins'][result.uuid] = result;
                }
                if (authReq["authRequestType"] == "logout") {
                    console.log ("LOGOUT: User: "+authReq.userName +" " +authReq.uuid);
                    try {delete sockets[_socketuuid]['logins'][authReq.uuid];} catch (error) {console.error ("socket.on('dizzbase_auth_request' - error deleting login: "+error)}                        
                }
            }
        });
    
        socket.on('disconnect', async (reason) => {
            console.log ("Client disconnect - "+reason);
            for (var prop in sockets[socketUuid]['connections']) {
                if (Object.prototype.hasOwnProperty.call(sockets[socketUuid]['connections'], prop)) {
                    sockets[socketUuid]['connections'][prop].dispose();
                    delete sockets[socketUuid]['connections'][prop];
                }
            }            
            delete sockets[socketUuid];
        });
    });
}

function auditSockets() {
    console.log("");
    console.log ("**** Socket/Connection/Query Audit starting ***");
    var found = false;
    for (var prop in sockets) {
        if (Object.prototype.hasOwnProperty.call(sockets, prop)) {
            found=true;
            console.log(" ");
            console.log ("**** Active Socket: "+prop);
            console.log ("CONNECTIONS: ");
            let connections = sockets[prop]['connections'];
            var found_connection = false;
            for (var prop_c in connections) {
                found_connection = true;
                if (Object.prototype.hasOwnProperty.call(connections, prop_c)) {
                    connections[prop_c].audit();
                }
            }
            if (found_connection == false) console.log ("    No active connections.");
            console.log ("LOGINS: ");
            let found_logins = false;
            let logins = sockets[prop]['logins'];
            for (var prop_l in logins) {
                found_logins = true;
                if (Object.prototype.hasOwnProperty.call(logins, prop_l)) {
                    console.log ("    " + logins[prop_l].userName + " " + logins[prop_l].uuid);
                }
            }
            if (found_logins == false) console.log ("    No active logins.");
        }
    }
    if (found==false) console.log ("No active sockets found.");
    console.log("");
}

module.exports = { initDizzbaseExpressServer, auditSockets};
