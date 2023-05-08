const rep = require ('pg-logical-replication');
require('dotenv').config();

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
    
    const plugin = new rep.PgoutputPlugin ({protoVersion: 1, publicationNames: ["pgoutput_test_pub"]});

    service.on('data', (lsn, log) => {
        console.log (log);
        /*
        try
        {
            gSock.send (JSON.stringify(log.change))
        } catch (error) {
            console.log (error);
        }
        // Do something what you want.
        // log.change.filter((change) => change.kind === 'insert').length;
        */
    });

    (function proc() {
        service.subscribe(plugin, 'my_slot')
        .catch((e) => {
            console.error(e);
        })
        .then(() => {
            setTimeout(proc, 100);
        });
    })();
}

module.exports = { initDBListener };
