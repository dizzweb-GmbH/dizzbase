const dbDictionary = require ('./dbDictionary');
const dbDizzbaseAdmin = require ('./dbDizzbaseAdmin.js');
const { Pool } = require('pg')
require('dotenv').config();

let pool;
let poolAdmin;

async function InitDB (params) {
    pool = new Pool(
        {
            user: process.env.POSTGRES_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
            host: process.env.POSTGRES_DB_HOST,
        }
    );
    poolAdmin = new Pool(
        {
            user: process.env.POSTGRES_ADMIN_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_ADMIN_PASSWORD,
            port: process.env.POSTGRES_DB_PORT,
            host: process.env.POSTGRES_DB_HOST,
        }
    );
    
    await dbDictionary.InitDBDictionary(poolAdmin);
    await dbDizzbaseAdmin.initDizzbaseAdmin (poolAdmin);
}

function getConnectionPool () {
    return pool;
}

function getConnectionPoolAdmin () {
    return poolAdmin;
}

module.exports = { InitDB, getConnectionPool, getConnectionPoolAdmin };
