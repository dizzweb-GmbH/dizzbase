const dizzbaseQuery = require ('./dizzbaseQuery');
const dizzbaseTransactions = require ('./dizzbaseTransactions');
const dbTools = require ('../dbTools/dbTools');
const dbDictionary = require ('../dbTools/dbDictionary');

let connections = {}; // list of active connections with uuid as key and the dizzbaseConnection object as value.

function initConnection(_uuid, nickName, socket) {
    let _connection = new dizzbaseConnection(_uuid, nickName, socket);
    connections[_uuid] = _connection;

    return _connection;
}

class dizzbaseConnection
{
    constructor (_uuid, _nickName, _socket)
    {
        this.uuid = _uuid
        this.socket = _socket;
        this.nickName = _nickName;
        this.queries = {};
    }

    async  dbRequestEvent(fromClientPacket) {
        //console.log ("XXX RECEIVING: Conn: " + this.nickName + " ("+this.uuid+") Req: " + fromClientPacket.dizzbaseRequest.nickName + " (" + fromClientPacket.dizzbaseRequest.transactionuuid+")");
        var res;    
        try {
            if (fromClientPacket.dizzbaseRequestType == 'dizzbasequery')
            {
                let q = this.queries[fromClientPacket.transactionuuid];
                if (q == null)
                {
                    q = new dizzbaseQuery.dizzbaseQuery (fromClientPacket, this);
                    this.queries[fromClientPacket.transactionuuid]=q;
                }
                q.execQuery();
            } else {
                let sqlWithParams = {};
                switch (fromClientPacket.dizzbaseRequestType) {
                    case 'dizzbaseupdate':
                        sqlWithParams = dizzbaseTransactions.dizzbaseUpateStatement (fromClientPacket['dizzbaseRequest']);
                        break;
                    case 'dizzbaseinsert':
                        sqlWithParams = dizzbaseTransactions.dizzbaseInsertStatement (fromClientPacket['dizzbaseRequest']);
                        break;
                    case 'dizzbasedelete':
                        sqlWithParams = dizzbaseTransactions.dizzbaseDeleteStatement (fromClientPacket['dizzbaseRequest']);
                        break;
                    case 'dizzbasedirectsql':
                        if (process.env.DIZZBASE_DIRECT_SQL_ENABLED != "1") throw 'DizzbaseDirectSQL request received, but this API is disabled for security reasons by default. Add DIZZBASE_DIRECT_SQL_ENABLED=1 if you want to use the API at the risk of SQL injection attacks.';
                        sqlWithParams = {sql: fromClientPacket['dizzbaseRequest']["sql"], params: null};
                        break;
                    default:
                        console.error (`Invalid dizzbaseRequestType: ${fromClientPacket.dizzbaseRequestType}`);
                }
                try {
                    await this.execSQL(fromClientPacket, sqlWithParams, null);
                } catch (error) {
                    console.log ("ERROR in dizzbaseConnection while executing SQL for transaction: " + error.toString());
                    throw "ERROR in dizzbaseConnection while executing SQL for transaction: " + error.toString();
                }
            }
        } catch (error) {
            console.error (error);
            var dizzbaseFromServerPacket = {};
            this.buildFromServerPacket (dizzbaseFromServerPacket, fromClientPacket, "dizzbase error: "+ error.toString(), 0);
            this.socket.emit ('dbrequest_response', dizzbaseFromServerPacket);
        }
    }
   
    async execSQL (fromClientPacket, sqlWithParams, postDBExecCallback)
    {
        try
        {
            var dizzbaseFromServerPacket = {};
            try {
                res = await dbTools.getConnectionPool().query(sqlWithParams.sql, sqlWithParams.params);
            } catch (error) {
                console.error (error);
                this.buildFromServerPacket (dizzbaseFromServerPacket, fromClientPacket, error, 0);
                this.socket.emit ('dbrequest_response', dizzbaseFromServerPacket);
                return res;
            }
            if (postDBExecCallback != null) postDBExecCallback(res);
            this.buildFromServerPacket (dizzbaseFromServerPacket, fromClientPacket, '', res.rowCount);

            //console.log ("XXX SENDING1: Conn: " + this.nickName + " ("+this.uuid+") Req: " + fromClientPacket.dizzbaseRequest.nickName + " (" + fromClientPacket.dizzbaseRequest.transactionuuid+")");
            dizzbaseFromServerPacket['data'] = res.rows;

            this.socket.emit ('dbrequest_response', dizzbaseFromServerPacket);
        } catch (error)
        {
            console.error ("Error in execSQL: ");
            console.error (error);
        }    
    }

    buildFromServerPacket (dizzbaseFromServerPacket, fromClientPacket, error, rowCount)
    {
        dizzbaseFromServerPacket['uuid'] = this.uuid;
        dizzbaseFromServerPacket['dizzbaseRequestType'] = fromClientPacket["dizzbaseRequestType"];
        dizzbaseFromServerPacket["transactionuuid"] = fromClientPacket["transactionuuid"];
        if (error.message != undefined)
            dizzbaseFromServerPacket['error'] = error.message.toString();
        else
            dizzbaseFromServerPacket['error'] = error.toString();
        dizzbaseFromServerPacket['rowCount'] = rowCount;
    }

    audit ()
    {
        console.log ("    Audit for connection: "+this.nickName+" - "+this.uuid);    
        for (var prop in this.queries) {
            if (Object.prototype.hasOwnProperty.call(this.queries, prop)) {
                console.log ("          Query: "+this.queries[prop].fromClientPacket.nickName + " - " + this.queries[prop].fromClientPacket.uuid + " - " + this.queries[prop].fromClientPacket.transactionuuid);
            }
        }
    }
    
    dispose()
    {
        for (var prop in this.queries) {
            if (Object.prototype.hasOwnProperty.call(this.queries, prop)) {
                this.queries[prop].dispose();
                delete this.queries[prop];
            }
        }        
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

            let queries = connections[prop].queries;
            for (var prop_q in queries) {
                if (Object.prototype.hasOwnProperty.call(queries, prop_q)) {
                    queries[prop_q].dbNotify (pkList);
                    //console.log ("XXX Notify: " + prop);
                }
            }
        }
    }
}

module.exports = { initConnection, notifyConnection };
