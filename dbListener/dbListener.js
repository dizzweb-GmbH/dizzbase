const rep = require ('pg-logical-replication');

function initDBListener ()
{
    const service = new rep.LogicalReplicationService(
        {
            user: 'postgres',
            database: 'test',
            password: 'postgres',
            port: 5432,
            host: '127.0.0.1',
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