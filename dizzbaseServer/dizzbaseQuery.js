const { getPrimaryKey, getForeignKey } = require("../dbTools/dbDictionary");
const dbTools = require ('../dbTools/dbTools');
const dizzbaseTransactions = require ('./dizzbaseTransactions');
const format = require ("pg-format");

const dizzPkeyPrefix = "dizz_pkey_";

class dizzbaseQuery
{
    dbNotify (data) {
        let dirty = false;

        data.every(e => {
            let table = e["table"];
            let key = e["pkValue"];
            try {
                if (this.pkeyTable[table] != undefined)
                {
                    this.pkeyTable[table].every(element => {
                        if (element == key)
                        {
                            dirty = true;
                            return false;
                        }
                        else {return true;}                        
                    });
                }                        
            } catch (error) {
                console.log (error);                    
            }
            if (dirty == false)
                return true;
            else
                return false;   
        });
        if (dirty)
        {
            this.execQuery();
        }
    }

    async execQuery()
    {
        await this.dizzbaseConnection.execSQL(this.fromClientPacket, {sql: this.sql, params: this.params}, (res) => {
            if (res != null) {
                if (res.rowCount >0) this.buildPkeyTable (res.rows);
            }
        });
    }

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

    processMainTable (mainTableJSON)
    {
        let _aliasOrName = this.resolveAlias (mainTableJSON["name"], mainTableJSON["alias"]);
        this.mainTable = _aliasOrName;
        this.aliasToName[_aliasOrName] = mainTableJSON["name"];
        this.from = format.ident (mainTableJSON["name"])+ " AS " + format.ident(_aliasOrName)+" ";
        this.cols = this.getColumns (_aliasOrName, mainTableJSON["columns"], mainTableJSON["alias"]);
        this.pkeyCols = format.ident(_aliasOrName)+'.' + format.ident(getPrimaryKey(mainTableJSON["name"])) + ' AS ' + format.ident(dizzPkeyPrefix + mainTableJSON["name"]) + ", ";

        // This is the short-cut call for loading just one record via primary key:
        if (mainTableJSON["pkey"] != 0)
        {
            this.params.push (mainTableJSON["pkey"]);
            if (this.where != "") this.where += " AND ";
            this.where += '('+format.ident(_aliasOrName) + '.' + format.ident(getPrimaryKey(mainTableJSON["name"])) + " = $"  + (this.params.length) + " ) ";        
        }
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
            this.pkeyCols += format.ident(_aliasOrName) +'.' + format.ident(getPrimaryKey(jt["name"])) + ' AS ' + format.ident (dizzPkeyPrefix + _aliasOrName) + ", ";

            this.aliasToName[_aliasOrName] = jt["name"];
            this.from += " JOIN "+ format.ident(jt["name"]) + " AS " + format.ident (_aliasOrName) + 
                " ON " + format.ident(_aliasOrName) + "." + format.ident(getPrimaryKey(jt["name"])) + "=" + format.ident(joinToTableOrAlias) + "." + format.ident(foreignKey) + " ";
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

    constructor (_fromClientPacket, _connection)
    {
        this.aliasToName = {};
        this.mainTable = "";
        this.from = "";
        this.sql = "";
        this.params = [];
        this.cols = "";
        this.pkeyCols = "";
        this.where = "";
        this.orderBy = " ORDER BY ";
        this.pkeyTable = {};
        this.fromClientPacket = _fromClientPacket;
        this.dizzbaseConnection = _connection;

        let j = this.fromClientPacket.dizzbaseRequest;
    
        this.processMainTable (j["table"]);
        this.processJoinedTables (j["joinedTables"]);

        // Create WHERE CLAUSE 
        // Note that processMainTable or processJoinedTables may already have added to the where clause, hence the +=
        let where_filter = dizzbaseTransactions.buildWhereClause (j["filters"], this.params);
        if (where_filter.trim() != "")
        {
             if (this.where != "") this.where += " AND ";
             this.where += where_filter;
        }

        /* Create ORDER BY CLAUSE  */
        if (j["sortFields"].length == 0) {this.orderBy = ""} else
        {
            j["sortFields"].forEach (o => {            
                this.orderBy += format.ident (o["table"]) + '.' + format.ident(o["column"]) + " ";
                if (o["ascending"] == true)
                    this.orderBy += "ASC ";
                else
                    this.orderBy += "DESC ";
                this.orderBy += ", "
            });
        }

        if (this.where.trim() != "") this.where = " WHERE " + this.where;
    
        this.sql = "SELECT " + this.cols +
            this.pkeyCols.substring (0, this.pkeyCols.length-2) + // remove trailing ", "
            " FROM " + this.from + 
            this.where
            + this.orderBy.substring(0, this.orderBy.length-2); // remove trailing ", "
    }

    dispose()
    {
        delete this.pkeyTable;
    }
}

module.exports = { dizzbaseQuery };
