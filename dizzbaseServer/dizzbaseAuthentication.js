const dbTools = require ('../dbTools/dbTools');
const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

var loginHashHashes = {};

function sendLoginResultToClient (socket, _error, _jwt)
{
    var result = {error: _error, jwt: _jwt};
    socket.emit ('dizzbase_login', result);

}

async function dizzbaseLogin(account, socket) {
    var identifyingField = "user_name";
    var identifyingValue = account["userName"];
    var loginError = "";

    if (account["email"] != "") {identifyingField="user_email"; identifyingValue=account["email"];}
    res = await dbTools.getConnectionPool().query ('SELECT * FROM dizzbase_user WHERE "'+identifyingField+'" = $1', [identifyingValue]);

    if (res["rowCount"] != 1)
    {
        console.log ("Login attempt with UNKNOWN USER.");
        sendLoginResultToClient (socket, "Unknown user", "");
    } else {
        if (res["rows"][0]["user_verified"] == false)
        {
            console.log ("Login attempt with UNVERIFIED USER.");
            sendLoginResultToClient (socket, "Unverified user", "");
        } else {
            argon2.verify(res["rows"][0]["user_pwd_argon2"], account["password"]).then(match => {
                if (match) {
                    var _pwdHashHash = crypto.createHash('md5').update(res["rows"][0]["user_pwd_argon2"]).digest('hex');
                    var data = {user_name: res["rows"][0]["user_name"], role: res["rows"][0]["user_role"], pwdHashHash: _pwdHashHash, }
                    const token = jwt.sign(data, process.env.JWT_SECRET /*, { expiresIn: '1h' }*/);

                    sendLoginResultToClient (socket, "", token);
                } else {
                    console.log ("Login attempt with INCORRECT PASSWORD.");
                    sendLoginResultToClient (socket, "Incorrect password", "");
                }
            }).catch(err => {
                console.error(err);
            });
        }
    }
}

module.exports = { dizzbaseLogin };
