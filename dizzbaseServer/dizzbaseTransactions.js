
const { getPrimaryKey } = require("../dbTools/dbDictionary");
const format = require ("pg-format");

function dizzbaseUpateStatement(request) {
    let sql = "UPDATE " + format.ident(request['table']) + " SET ";
    let params = [];
    for (let i = 0; i < request['fields'].length; i++) {
        sql += format.ident(request['fields'][i]) + " = " + "$"+(i+1) + ", "; // note the (i+1) as parameters are starting at $1
        params.push (request['values'][i]);
    }

    sql = sql.substring (0, sql.length-2);
    sql +=  " WHERE " + buildWhereClause (request['filters'], params);

    return {sql: sql, params: params};
}

function dizzbaseInsertStatement(request) {
    let sql = "INSERT INTO " + format.ident(request['table']) + " ( ";
    let params = [];
    for (let i = 0; i < request['fields'].length; i++) {
        sql += format.ident (request['fields'][i]) + ", ";
    }
    sql = sql.substring(0, sql.length-2) + ") VALUES ( ";
    for (let i = 0; i < request['fields'].length; i++) {
        sql += "$" + (i+1) + ", ";   // note the (i+1) as parameters are starting at $1
        params.push (request['values'][i]);
    }
    // We return the primary as two columns to allow "generic" retrieval in case with don't know the name of the column.
    sql = sql.substring(0, sql.length-2) + " ) RETURNING " + format.ident (getPrimaryKey(request['table'])) + ", " + format.ident (getPrimaryKey(request['table'])) + " AS pkey ";

    return {sql: sql, params: params};
}

function dizzbaseDeleteStatement(request) {
    let sql = "DELETE FROM " + format.ident(request['table']) +' ';
    let params = [];
    sql += " WHERE " + buildWhereClause (request['filters'], params);

    return {sql: sql, params: params};
}

function buildWhereClause(filters, params) {
    let where = "";
    let i = params.length;

    filters.forEach (f => {
        let c = f["comparison"].trim().toUpperCase();
        // Check for allowed comparisons to secure against SQL injection
        // Currently unsupported SQL Comparisons: BETWEEN, IN
        if (!((c=="=") || (c==">") || (c=="<") || (c==">=") || (c=="<=") || (c=="LIKE") || (c=="!=") || (c=="<>"))) throw "Illegal comparison operator in filter: "+f["comparison"];

        i++;
        if (where != "") where += " AND ";
        where += '('+format.ident(f["table"])+ '.' + format.ident(f["column"])+' ' + c + ' $' + i + ")";
        params.push (f["value"]);
    });

    return where;
}

module.exports = { dizzbaseUpateStatement, dizzbaseInsertStatement, dizzbaseDeleteStatement, buildWhereClause };
