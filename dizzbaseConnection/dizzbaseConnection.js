const dizzbaseQuery = require ('./dizzbaseQuery');

let connections = {}; // list of active connections with uuid as key and the dizzbaseConnection object as value.

function dbRequestEvent(request) {

    if (request['type'] == 'query')
    {
        connections[request['uuid']].setQuery (request);
        connections[request['uuid']].runQuery ();
    }
}

function initConnection(_uuid, socket) {
    _connection = new dizzbaseConnection(_uuid, socket);
    connections[_uuid] = _connection;
}

function closeConnections (_uuidList)
{
    _uuidList.forEach ((_uuid) => {
        delete connections[_uuid];
    });
}

class dizzbaseConnection
{
    constructor (_uuid, _socket)
    {
        this.query = null;
        this.uuid = _uuid
        this.socket = _socket;
    }

    setQuery (query)
    {
        this.query = new dizzbaseQuery.dizzbaseQuery (query);
    }

    async runQuery ()
    {
        res = await this.query.runQuery();
        res['uuid'] = this.uuid;
        let response = {};
        response['uuid'] = this.uuid;
        response['type'] = 'query';
        response['data'] = res;
        this.socket.emit ('data', response);    
    }
}

module.exports = { dbRequestEvent, initConnection, closeConnections };
