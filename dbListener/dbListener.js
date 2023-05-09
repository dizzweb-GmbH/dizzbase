const rep = require ('pg-logical-replication');
const PubSub = require('pubsub-js');
require('dotenv').config();
const dbTools = require('../dbTools/dbDictionary')

function initDBListener ()
{
    const service = new rep.LogicalReplicationService(
        {
            user: process.env.POSTGRES_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
            host: process.env.POSTGRES_DB_HOST,
        },
        /**
         * Logical replication service config
         * https://github.com/kibae/pg-logical-replication/blob/main/src/logical-replication-service.ts#L9
         */
        {
            acknowledge: {
            auto: true,
            timeoutSeconds: 10
            }
        }
    )
    
    const plugin = new rep.PgoutputPlugin ({protoVersion: 1, publicationNames: ["pgoutput_dizzbase_pub"]});

    service.on('data', (lsn, log) => {
        //console.log (log);
        var primekeys = [];
        try
        {
            if(log["tag"] == "delete" | "insert" | "update"){
                var temp = []
                temp.push(log["relation"]["name"])
                var pkName = dbTools.getPrimaryKey(log["relation"]["name"])
                temp.push(log["key"][pkName])
                primekeys.push(temp)
                //console.log(primekeys)
                
                PubSub.publish('db_change', primekeys);
            }
            //gSock.send (JSON.stringify(log.change))
        } catch (error) {
            console.log (error);
        }
        // Do something what you want.
        // log.change.filter((change) => change.kind === 'insert').length;S
    });

    (function proc() {
        service.subscribe(plugin, 'dizzbase_slot')
        
        .catch((e) => {
            console.error(e);
        })
        .then(() => {
            setTimeout(proc, 100);
        });
    })();
}

module.exports = { initDBListener };
