const { getPrimaryKey, getForeignKey } = require("../dbTools/dbDictionary");
const dbTools = require ('../dbTools/dbTools');

const dizzPkeyPrefix = "dizz_pkey_";

class dizzbaseQuery
{
    resolveAlias (tablename, alias) {
        if (alias == undefined) return tablename;
        if (alias == "") return tablename;
        return alias;        
    }

    getColumns (aliasOrName, cols, alias)
    {
        let colsStr = '"'+aliasOrName+'"'+"."+"*, ";
        if (cols == undefined)
            return colsStr;
        if (cols.length == 0)
            return colsStr;
        colsStr = "";
        cols.forEach(c => {
            colsStr = colsStr + '"'+aliasOrName+'"' + "." + '"'+c+'"';
            if (alias != "")
                colsStr += " AS " + alias + "_" + c;            
            colsStr += ", ";
        });
        return colsStr;
    }

    async runQuery() {
        res = await dbTools.getConnectionPool().query(this.sql);
        this.buildPkeyTable (res.rows);

        return res.rows;
    }

    processMainTable (mainTableJSON)
    {
        let _aliasOrName = this.resolveAlias (mainTableJSON["name"], mainTableJSON["alias"]);
        this.mainTable = _aliasOrName;
        this.aliasToName[_aliasOrName] = mainTableJSON["name"];
        this.from = '"'+mainTableJSON["name"]+'"' + " AS " + '"'+_aliasOrName+'"';
        this.cols = this.getColumns (_aliasOrName, mainTableJSON["columns"], mainTableJSON["alias"]);
        this.pkeyCols = '"'+_aliasOrName+'"."' + getPrimaryKey(mainTableJSON["name"]) + '" AS ' + dizzPkeyPrefix + mainTableJSON["name"] + ", ";

        // This is the short-cut call for loading just one record via primary key:
        if (mainTableJSON["pkey"] != 0)
            this.where += '("'+_aliasOrName+'"' + '.' + '"'+getPrimaryKey(mainTableJSON["name"])+'"' + "=" + "'" + mainTableJSON["pkey"] +"'" + ") AND ";        
    }

    processJoinedTables (joinedTablesJSON)
    {
        joinedTablesJSON.forEach (jt => {
            let joinToTableOrAlias = this.mainTable;
            if (jt["joinToTableOrAlias"] != "")
                joinToTableOrAlias = jt["joinToTableOrAlias"];
            let foreignKey = jt["foreignKey"];
            if (foreignKey == "")
                foreignKey = getForeignKey(joinToTableOrAlias, jt["name"]);

            let _aliasOrName = this.resolveAlias (jt["name"], jt["alias"]);
            this.cols += this.getColumns (_aliasOrName, jt["columns"], jt["alias"]);
            this.pkeyCols += '"'+_aliasOrName+'"."' + getPrimaryKey(jt["name"]) + '" AS ' + dizzPkeyPrefix + _aliasOrName + ", ";

            this.aliasToName[_aliasOrName] = jt["name"];
            this.from += " JOIN "+ '"'+jt["name"]+'"' + " AS " + '"'+_aliasOrName+'"' + 
                " ON " + '"'+_aliasOrName+'"' + "." + '"'+getPrimaryKey(jt["name"])+'"' + "=" + '"'+joinToTableOrAlias+'"' + "." + '"'+foreignKey+'"' + " ";
        });
    }

    addPkey (table, key)
    {
        if (this.pkeyTable[table] == undefined)
        {
            this.pkeyTable[table] = [key];
        }
        else
        {
            let found = false; 
            this.pkeyTable[table].forEach ((k) =>{
                if (k == key)
                    found = true;
            })
            if (found == false)
                this.pkeyTable[table].push (key);
        }
    }

    buildPkeyTable (rows)
    {
        rows.forEach ((r) =>
        {
            let foundProps = [];
            for (var prop in r) {
                if (Object.prototype.hasOwnProperty.call(r, prop)) {
                    if (prop.length > dizzPkeyPrefix.length)
                    {
                        if (prop.substring (0, dizzPkeyPrefix.length) == dizzPkeyPrefix)
                        {
                            let table = prop.substring (dizzPkeyPrefix.length);
                            this.addPkey (this.aliasToName[table], r[prop]);
                            foundProps.push(prop);
                        }
                    }
                }
            }
            foundProps.forEach ((p) => {
                delete r[p];
            });
        });
    }

    constructor (j)
    {
        this.aliasToName = {};
        this.mainTable = "";
        this.from = "";
        this.sql = "";
        this.cols = "";
        this.pkeyCols = "";
        this.where = " WHERE ";
        this.orderBy = " ORDER BY ";
        this.pkeyTable = {};
    
        this.processMainTable (j["table"]);
        this.processJoinedTables (j["joinedTables"]);

        /* Creat WHERE CLAUSE  */
        j["filters"].forEach (f => {            
            this.where += '("'+f["table"]+'"' + '.' + '"'+f["column"]+'"' + f["comparison"] + " " + "'" + f["value"] +"'" + ") AND ";
        });

        if (this.where.indexOf ("AND") == -1) // nothing has been added to the where clause
            this.where = "    "; // set to 4 blanks which will be removed below.

        /* Create ORDER BY CLAUSE  */
        if (j["sortFields"].length == 0) {this.orderBy = ""} else
        {
            j["sortFields"].forEach (o => {            
                this.orderBy += '"'+o["table"]+'"' + '.' + '"'+o["column"]+'"' + " ";
                if (o["ascending"] == true)
                    this.orderBy += "ASC ";
                else
                    this.orderBy += "DESC ";
                this.orderBy += ", "
            });
        }
    
        // To Do: Migrate to SQL Parameter Binding: https://node-postgres.com/features/queries
        this.sql = "SELECT " + this.cols +
            this.pkeyCols.substring (0, this.pkeyCols.length-2) + // remove trailing ", "
            " FROM " + this.from + this.where.substring(0, this.where.length-4)  // remove trailing "AND "
            + this.orderBy.substring(0, this.orderBy.length-2); // remove trailing ", "
    }
}

module.exports = { dizzbaseQuery };
