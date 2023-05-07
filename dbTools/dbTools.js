const dbDictionary = require ('./dbDictionary');
const { Pool } = require('pg')

let pool;

async function InitDB (params) {
    pool = new Pool(
        {
            user: 'postgres',
            host: 'localhost',
            database: 'test',
            password: 'postgres',
            port: 5432
        }
    )
    
    await dbDictionary.InitDBDictionary(pool);
    //const res = await pool.query('SELECT NOW()')
    //console.log (res);
    //await pool.end()        
}

module.exports = { InitDB };
