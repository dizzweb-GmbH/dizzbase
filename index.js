const dizzbaseServer = require ('./dizzbaseServer/dizzbaseServer');
const dbTools = require ('./dbTools/dbTools')

async function dizzbaseExpressServer (server)
{
    dizzbaseServer.initDizzbaseExpressServer(server);
}

async function dizzbaseStandaloneServer (port)
{
    console.log ("dizzbaseStandaloneServer is not yet implemented, please integrate with express.");
}

// Logs connection, etc. information to the console - for debugging use
function audit ()
{
    dizzbaseServer.auditSockets();
}

// Returns a non-admin DB connection for direct SQL access from backend ressources, eg. express endpoints
function getDBConnection ()
{
    return  dbTools.getConnectionPool ();
}

module.exports = { dizzbaseExpressServer, dizzbaseStandaloneServer, audit, getDBConnection }
