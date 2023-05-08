const dbDictionary = require ('./dbDictionary');
const { Pool } = require('pg')
require('dotenv').config();

let pool;

async function InitDB (params) {
    pool = new Pool(
        {
            user: process.env.POSTGRES_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
            host: process.env.POSTGRES_DB_HOST,
        }
    )
    
    await dbDictionary.InitDBDictionary(pool);
    //const res = await pool.query('SELECT NOW()')
    //console.log (res);
    //await pool.end()        
}

module.exports = { InitDB };
