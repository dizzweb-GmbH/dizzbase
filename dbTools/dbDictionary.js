const pg = require ('pg');
const fs = require('fs');
const path = require('path');

var pKeys = {};
var fKeyDB = {};

async function InitDBDictionary (pool) {
    const sqlPKeyFilePath = path.join(__dirname, '../sql/primarykeys.sql');
    pkey_query = fs.readFileSync (sqlPKeyFilePath, 'ascii');
    res = await pool.query (pkey_query);
    res.rows.forEach(row => {
        pKeys[row.table] = row.pkey
    });

    const sqlFKeyFilePath = path.join(__dirname, '../sql/foreignkeys.sql');
    pkey_query = fs.readFileSync (sqlFKeyFilePath, 'ascii');
    res = await pool.query (pkey_query);
    fKeyDB = res.rows;

    console.log ('Dictionary loaded.');
}

// Retrieves all tables t points to
// The result contains the fkey col of t (as the key) and the name of the table the fkey points to (as the value)
function getLinkedTables (t)
{
    let links = {};
    fKeyDB.forEach(e => {
        if (e["table"]==t)
        {
            links[e["fkey"]] = e["foreign_table"]
        }        
    });
    return links;
}

function getPrimaryKey (tableName) {
    let res = pKeys[tableName];
    if (res == null) throw ("dizzbase Error in getPrimaryKey: Cannot find primary key for table, either the table does not exist or no primary key is defined- table: " + tableName);
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

    if (res == "") throw ("dizzbase Error in getForeignKey: Cannot find foreign key for table - constraint may not exist - table: " + tableName + " / joined table: "+joinedTableName);
    return res;
}

module.exports = { InitDBDictionary, getPrimaryKey, getForeignKey, getLinkedTables };
