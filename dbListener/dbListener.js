const rep = require ('pg-logical-replication');
require('dotenv').config();
const dbTools = require('../dbTools/dbDictionary')
const dbConnection = require ('../dizzbaseServer/dizzbaseConnection');

function initDBListener ()
{
    const service = new rep.LogicalReplicationService(
        {
            user: process.env.POSTGRES_ADMIN_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_ADMIN_PASSWORD,
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
        try
        {
            var pkValue = 0;
            var pkList = []; // We publish a list so that we can change to a multi-key publish in the future
            var pkName = ""
            var insertedRow = {};
            if((log["tag"] == "insert") || (log["tag"] == "update")){
                pkName = dbTools.getPrimaryKey(log["relation"]["name"]);
                pkValue = log["new"][pkName];
                if (log["tag"] == "insert") {insertedRow = log["new"];}
            }
            if (log["tag"] == "delete")
            {
                pkName = dbTools.getPrimaryKey(log["relation"]["name"]);
                pkValue = log["key"][pkName];
            }

            if (pkValue != 0)
            {
                var data = {
                    action: log["tag"],
                    table: log["relation"]["name"],
                    pkValue: pkValue,
                    insertedRow: insertedRow
                }

                // We publish a list so that we can change to a multi-key publish in the future
                pkList.push(data)
                dbConnection.notifyConnection(pkList);
            }
        } catch (error) {
            console.log (error);
        }
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
