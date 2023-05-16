const dizzbaseServer = require ('./dizzbaseServer/dizzbaseServer');

async function dizzbaseExpressServer (server)
{
    dizzbaseServer.initDizzbaseExpressServer(server);
}

async function dizzbaseStandaloneServer (port)
{
    console.log ("dizzbaseStandaloneServer is not yet implemented, please integrate with express.");
}

function audit ()
{
    dizzbaseServer.auditSockets();
}

module.exports = { dizzbaseExpressServer, dizzbaseStandaloneServer, audit }
