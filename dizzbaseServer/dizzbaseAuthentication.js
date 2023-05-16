const dbTools = require ('../dbTools/dbTools');
const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

var loginHashHashes = {};

function dizzbaseAuthRequest (req, socket, callback)
{
    if (req["authRequestType"] == "login")
    {
        dizzbaseLogin(req, socket, callback);
    }
    if (req["authRequestType"] == "logout")
    {
        callback ("logout", req);
    }
    if (req["authRequestType"] == "create")
    {
        //callback ("logout", req);
    }
    if (req["authRequestType"] == "delete")
    {
        //callback ("logout", req);
    }
    if (req["authRequestType"] == "update")
    {
        //callback ("logout", req);
    }
}

async function dizzbaseLogin(account, socket, callback) {
    var identifyingField = "user_name";
    var identifyingValue = account["userName"];
    if (account["email"] != "") {identifyingField="user_email"; identifyingValue=account["email"];}
    res = await dbTools.getConnectionPoolAdmin().query ('SELECT * FROM dizzbase_user WHERE "'+identifyingField+'" = $1', [identifyingValue]);

    if (res["rowCount"] != 1)
    {
        console.log ("Login attempt with UNKNOWN USER.");
        socket.emit ('dizzbase_auth_response', {"error": "Login attempt with UNKNOWN USER."});
        return;
    }
    if (res["rows"][0]["user_verified"] == false)
    {
        console.log ("Login attempt with UNVERIFIED USER.");
        socket.emit ('dizzbase_auth_response', {"error": "Login attempt with UNVERIFIED USER."});
        return;
    } 

    argon2.verify(res["rows"][0]["user_pwd_argon2"], account["password"]).then(match => {
        if (match) {
            //var _pwdHashHash = crypto.createHash('md5').update(res["rows"][0]["user_pwd_argon2"]).digest('hex');
            _uuid = crypto.randomUUID();
            var data = {user_id: res["rows"][0]["user_id"], user_name: res["rows"][0]["user_name"], user_role: res["rows"][0]["user_role"], uuid: _uuid /*, pwdHashHash: _pwdHashHash, */}
            const token = jwt.sign(data, process.env.JWT_SECRET /*, { expiresIn: '1h' }*/);
            let response = {
                "userID": res["rows"][0]["user_id"],
                "userName": res["rows"][0]["user_name"],
                "email": res["rows"][0]["user_email"],
                "role": res["rows"][0]["user_role"],
                "verified": res["rows"][0]["user_verified"],
                "uuid": _uuid,
                "jwt": token,
                "error": "",
                "response_type": "login"
            }
            callback ("login", response)
            socket.emit ('dizzbase_auth_response', response);
        } else {
            console.log ("Login attempt with INCORRECT PASSWORD.");
            socket.emit ('dizzbase_auth_response', {"error": "Login attempt with INCORRECT PASSWORD."});
        }
    }).catch(err => {
        console.error(err);
    });
}

module.exports = { dizzbaseAuthRequest };
