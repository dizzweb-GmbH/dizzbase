
const { getPrimaryKey } = require("../dbTools/dbDictionary");

function dizzbaseUpateStatement(request) {
    let sql = "UPDATE " + '"'+request['table']+'"' + " SET ";
    for (let i = 0; i < request['fields'].length; i++) {
        sql += '"'+request['fields'][i]+'"' + " = " + "'"+request['values'][i]+"'" + ", ";
    }

    sql = sql.substring (0, sql.length-2);
    sql += buildWhereClause (request['filters']);
    return sql;
}

function dizzbaseInsertStatement(request) {
    let sql = "INSERT INTO " + '"'+request['table']+'"' + " ( ";
    for (let i = 0; i < request['fields'].length; i++) {
        sql += '"'+request['fields'][i]+'"' + ", ";
    }
    sql = sql.substring(0, sql.length-2) + ") VALUES ( ";
    for (let i = 0; i < request['fields'].length; i++) {
        sql += "'"+request['values'][i]+"'" + ", ";
    }
    // We return the primary as two columns to allow "generic" retrieval in case with don't know the name of the column.
    sql = sql.substring(0, sql.length-2) + " ) RETURNING " + getPrimaryKey(request['table']) + ", " + getPrimaryKey(request['table']) + " AS pkey ";    
    return sql;
}

function dizzbaseDeleteStatement(request) {
    let sql = "DELETE FROM " + '"'+request['table']+'" ';
    sql += buildWhereClause (request['filters']);

    return sql;
}

function buildWhereClause(filters) {
    let where = " WHERE ";
    filters.forEach (f => {            
        where += '("'+f["table"]+'"' + '.' + '"'+f["column"]+'"' + f["comparison"] + " " + "'" + f["value"] +"'" + ") AND ";
    });

    if (where.indexOf ("AND") == -1) // nothing has been added to the where clause
        where = "    "; // set to 4 blanks which will be removed below.

    return where.substring(0, where.length-4); // remove trailing AND or blanks
}

module.exports = { dizzbaseUpateStatement, dizzbaseInsertStatement, dizzbaseDeleteStatement };
