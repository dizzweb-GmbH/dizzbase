const dizzbaseQuery = require ('./dizzbaseQuery');

class dizzbaseConnection
{
    constructor (queryJSONString)
    {
        this.query = new dizzbaseQuery.dizzbaseQuery (queryJSONString);
    }
    async runQuery ()
    {
        return await this.query.runQuery();
    }
}

module.exports = { dizzbaseConnection };
