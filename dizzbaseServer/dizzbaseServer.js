const { Server } = require("socket.io");
const dizzbaseConnection = require ('./dizzbaseConnection');
const dbListener = require ('../dbListener/dbListener');
const dizzbaseAuthentication = require ('./dizzbaseAuthentication');
const dbTools = require ('../dbTools/dbTools');

const socketioJwt = require('socketio-jwt');

async function initDizzbaseExpressServer(server) {
    await dbTools.InitDB();
    console.log ("Dizzbase has initialized the database connection.")
    dbListener.initDBListener();

    const io = new Server(server, {
        cors: {
          origin: true,
          methods: ["GET", "POST"]
        }
    });

    var JWT = process.env.JWT_SECRET;
    if (JWT == undefined) {JWT = "";}
    
    if (JWT != "") 
    {
        io.use(socketioJwt.authorize({
            secret: process.env.JWT_SECRET, // Replace with your secret key
            handshake: true,
            auth_header_required: true,
            
            fail: function (error, data, accept) {
                if (error) {
                    console.log("Failed authentication - invalid JWT");
                    accept(new Error("JWT"));
                } else {
                    console.log("Failed authentication - unknown error.");
                    accept(null, false);
                }
            }
        }));
    }

    io.on('connection', function (socket) {
        console.log('Client has connected');
        
        if (process.env.JWT_SECRET)
            console.log('JWT: ', socket.decoded_token.name);
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
    
        socket.on('dizzbase_login', (req) => {
            dizzbaseAuthentication.dizzbaseLogin(req, socket);
        });
    
        socket.on('disconnect', async (reason) => {
            dizzbaseConnection.closeConnections (uuidList);
            uuidList = [];
            console.log ("Client disconnect - "+reason);
        });
    });
}

module.exports = { initDizzbaseExpressServer };
