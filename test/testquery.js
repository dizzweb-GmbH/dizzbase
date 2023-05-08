const fs = require('fs');
const dizzbaseConnection = require ('../dizzbaseConnection/dizzbaseConnection');

function runTestQuery() {
    testJSON = fs.readFileSync ('./test/testquery.json', 'ascii');
    new dizzbaseConnection.dizzbaseConnection (testJSON);
}

module.exports = { runTestQuery };

