const pg = require ('pg');
const fs = require('fs');

var pKeys = {};
var fKeyDB = {};

async function InitDBDictionary (pool) {
    pkey_query = fs.readFileSync ('./sql/primarykeys.sql', 'ascii');
    res = await pool.query (pkey_query);
    res.rows.forEach(row => {
        pKeys[row.table] = row.pkey
    });

    pkey_query = fs.readFileSync ('./sql/foreignkeys.sql', 'ascii');
    res = await pool.query (pkey_query);
    fKeyDB = res.rows;

    console.log ('Dictionary loaded.');
}

function getPrimaryKey (tableName) {
    return pKeys[tableName];
}

function getForeignKey (tableName, joinedTableName) {
    var res = "";
    fKeyDB.every(row => {
        if (row['table'] == tableName)
        {
            if (row['foreign_table'] == joinedTableName)
            {
                res = row['fkey']
                return false;
            }
        }
        return true;
    });

    return res;
}

module.exports = { InitDBDictionary, getPrimaryKey, getForeignKey };
