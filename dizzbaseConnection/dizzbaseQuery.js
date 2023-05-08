const { getPrimaryKey, getForeignKey } = require("../dbTools/dbDictionary");
const dbTools = require ('../dbTools/dbTools');

class dizzbaseQuery
{
    getAlias (tablename, alias) {
        if (alias == undefined) return tablename;
        if (alias == "") return tablename;
        return alias;        
    }

    getColumns (table, cols)
    {
        let colsStr = '"'+table+'"'+"."+"*, ";
        if (cols == undefined)
            return colsStr;
        if (cols.length == 0)
            return colsStr;
        colsStr = "";
        cols.forEach(c => {
            colsStr = colsStr + '"'+table+'"' + "." + '"'+c+'"' + ", ";
        });
        return colsStr;
    }

    async runQuery() {
        res = await dbTools.getConnectionPool().query(sql);        
    }

    constructor (queryJSONString)
    {
        this.alias = {};
        this.sql = "";
        let cols = "";
        let where = " WHERE ";
        let orderBy = " ORDER BY ";
    
        let j = JSON.parse (queryJSONString);

        /* Main Table */
        let _alias = this.getAlias (j["table"]["name"], j["table"]["alias"]);
        let _mainTable = _alias;
        this.alias[_alias] = j["table"]["name"];
        let table = '"'+j["table"]["name"]+'"' + " AS " + '"'+_alias+'"';
        cols = this.getColumns (_alias, j["table"]["columns"]);

        // This is the short-cut call for loading just one record via primary key:
        if (j["table"]["pkey"] != 0)
            where += '("'+_alias+'"' + '.' + '"'+getPrimaryKey(j["table"]["name"])+'"' + "=" + "'" + j["table"]["pkey"] +"'" + ") AND ";        


        /* Joined Tables */
        j["joinedTables"].forEach (jt => {
            let joinToTableOrAlias = _mainTable;
            if (jt["joinToTableOrAlias"] != "")
                joinToTableOrAlias = jt["joinToTableOrAlias"];
            let foreignKey = jt["foreignKey"];
            if (foreignKey == "")
                foreignKey = getForeignKey(joinToTableOrAlias, jt["name"]);

            _alias = this.getAlias (jt["name"], jt["alias"]);
            cols += this.getColumns (_alias, jt["columns"]);

            this.alias[_alias] = jt["name"];
            table += " JOIN "+ '"'+jt["name"]+'"' + " AS " + '"'+_alias+'"' + 
                " ON " + '"'+_alias+'"' + "." + '"'+getPrimaryKey(jt["name"])+'"' + "=" + '"'+joinToTableOrAlias+'"' + "." + '"'+foreignKey+'"' + " ";
        });

        /* Creat WHERE CLAUSE  */
        j["filters"].forEach (f => {            
            where += '("'+f["table"]+'"' + '.' + '"'+f["column"]+'"' + f["comparison"] + " " + "'" + f["value"] +"'" + ") AND ";
        });

        /* Create ORDER BY CLAUSE  */
        j["sortFields"].forEach (o => {            
            orderBy += '"'+o["table"]+'"' + '.' + '"'+o["column"]+'"' + " ";
            if (o["ascending"] == true)
                orderBy += "ASC ";
            else
                orderBy += "DESC ";
            orderBy += ", "
        });
    
        this.sql = "SELECT " + cols.substring(0, cols.length-2) + // remove trailing ", "
            " FROM " + table + where.substring(0, where.length-4)  // remove trailing "AND "
            + orderBy.substring(0, orderBy.length-2); // remove trailing ", "
        console.log ("Query: ");

        (async () => {
            res = await dbTools.getConnectionPool().query(this.sql);
            console.log (res);
        })()
    }
}

module.exports = { dizzbaseQuery };
