const dizzbaseServer = require ('./dizzbaseServer/dizzbaseServer');

initDizzbaseExpressServer (server)
{
    dizzbaseServer.initDizzbaseExpressServer(server)
}

module.exports = { initDizzbaseExpressServer };
