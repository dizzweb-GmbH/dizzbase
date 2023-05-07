const pg = require ('pg');
const fs = require('fs');

var pKeys;

async function InitDBDictionary (pool) {
    pkey_query = fs.readFileSync ('./sql/primarykeys.sql', 'ascii');
    console.log (pkey_query);

    res = await pool.query (pkey_query);

    console.log ('Dictionary loaded.');
}

module.exports = { InitDBDictionary };