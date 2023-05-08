const dizzbaseQuery = require ('./dizzbaseQuery');

class dizzbaseConnection
{
    constructor (queryJSONString)
    {
        this.query = new dizzbaseQuery.dizzbaseQuery (queryJSONString);
    }
}

module.exports = { dizzbaseConnection };
