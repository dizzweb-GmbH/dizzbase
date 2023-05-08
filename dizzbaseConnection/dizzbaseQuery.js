const { getPrimaryKey, getForeignKey } = require("../dbTools/dbDictionary");

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

    constructor (queryJSONString)
    {
        this.alias = {};
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

        /* Filter/WHERE CLAUSE  */
        j["filters"].forEach (f => {            
            where += '"'+f["table"]+'"' + '.' + '"'+f["column"]+'"' + f["comparison"] + " " + f["value"] + " ";
        });

        /* Filter/WHERE CLAUSE  */
        j["sortFields"].forEach (o => {            
            orderBy += '"'+o["table"]+'"' + '.' + '"'+o["column"]+'"' + " ";
            if (o["ascending"] == true)
                orderBy += "ASC ";
            else
                orderBy += "DESC ";
        });

        let select = "SELECT  " + cols + table + where + orderBy;
        console.log ("Query: ");
    }
}

module.exports = { dizzbaseQuery };
