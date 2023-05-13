// Use the utility to create hashes to insert into your database, eg. for test or admin users
// Usage: node dizzbase/createArgon2Hash.js mypassword

const argon2 = require('argon2');
const args = process.argv.slice(2); // remove first two default parameters (node and path)

argon2.hash(args[0]).then(hash => {
    console.log(hash);
}).catch(err => {
    console.error(err);
});
