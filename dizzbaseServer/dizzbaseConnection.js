const dizzbaseQuery = require ('./dizzbaseQuery');
const dizzbaseTransactions = require ('./dizzbaseTransactions');
const dbTools = require ('../dbTools/dbTools');
const dbDictionary = require ('../dbTools/dbDictionary');

let connections = {}; // list of active connections with uuid as key and the dizzbaseConnection object as value.

async function dbRequestEvent(request) {

    if (request['type'] == 'dizzbasequery')
    {
        connections[request['uuid']].setQuery (request);
        connections[request['uuid']].runQuery (request);
    } else {
        let sql = "";
        if (request['type'] == 'dizzbaseupdate')
        {
            sql = dizzbaseTransactions.dizzbaseUpateStatement (request);
        }
        if (request['type'] == 'dizzbaseinsert')
        {
            sql = dizzbaseTransactions.dizzbaseInsertStatement (request);
        }
        if (request['type'] == 'dizzbasedelete')
        {
            sql = dizzbaseTransactions.dizzbaseDeleteStatement (request);
        }
        if (request['type'] == 'dizzbasedirectsql')
        {
            sql = request["sql"];
        }
        try {
            connections[request['uuid']].executeTransaction(request, sql);            
        } catch (error) {
            console.log ("ERROR in dizzbaseConnection/dbRequestEvent - probably unknow uuid due to lost connection.");
        }
    }
}

function initConnection(_uuid, socket) {
    let _connection = new dizzbaseConnection(_uuid, socket);
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

    setQuery (request)
    {
        this.query = new dizzbaseQuery.dizzbaseQuery (request, this);
    }

    async runQuery (request)
    {
        let response = {};
        let stat = "";
        try {
            res = await this.query.runQuery();
        } catch (error) {
            stat = this.createStatusReport (request, error, 0, this.query.sql);
            response['status'] = stat;
            this.socket.emit ('data', response);
            return;
        }
        stat = this.createStatusReport (request, '', res.rowCount, '');
        response['data'] = res;
        response['status'] = stat;
        this.socket.emit ('data', response);    
        return;
    }

    async executeTransaction (request, sql)
    {
        var res;
        let stat = {};
        let retVal = {};
        let err = false;
        try {
            res = await dbTools.getConnectionPool().query (sql);
        } catch (error) {
            let message = "";
            try {message = error["message"];} catch (error) {}
            stat = this.createStatusReport (request, error + " | " + message, 0, sql);
            err = true;
        }
        if (err == false){stat = this.createStatusReport (request, '', res.rowCount, '');}

        retVal["status"] = stat;
        if ((request['type'] == 'dizzbaseinsert') || (request['type'] == 'dizzbasedirectsql'))
        {
            if (err == false) retVal["data"] = res["rows"];
        }
        this.socket.emit ('status', retVal);
        return;
    }

    createStatusReport (request, error, rowCount, sql)
    {
        let statusReport = {};
        statusReport['uuid'] = this.uuid;
        statusReport['type'] = request["type"];
        statusReport["transactionuuid"] = request["transactionuuid"];
        statusReport['error'] = error;
        statusReport['rowCount'] = rowCount;
        statusReport['sql'] = sql;
        return statusReport;
    }
}

// Notifies all open connections that a database change has occured.
// Called by dbListener
function notifyConnection(pkList) 
{
    // For all foreign key in the newly inserted row we create updated events for the tables/pkeys they are pointing to
    // This help to keep lists of parent/child records up to date
    var indirectList = [];
    pkList.forEach(r => {
        if (r['action']=='insert')
        {
            let table = r['table'];
            let res = dbDictionary.getLinkedTables (table);
            
            for (var prop in res) {
                if (Object.prototype.hasOwnProperty.call(res, prop)) {
                    var data = {
                        action: 'insert',
                        table: res[prop], // prop is the fkey, so res[prop] is the table the key points to
                        pkValue: r["insertedRow"][prop]
                    }
                    indirectList.push(data);                        
                }
            }
        }        
    });
    if (indirectList.length > 0)
    {
        pkList = pkList.concat(indirectList);
    }
    for (var prop in connections) {
        if (Object.prototype.hasOwnProperty.call(connections, prop)) {
            if (connections[prop].query != null)
            {
                if (connections[prop].query != undefined)
                    connections[prop].query.dbNotify (pkList);
            }
        }
    }
}

module.exports = { dbRequestEvent, initConnection, closeConnections, notifyConnection };
