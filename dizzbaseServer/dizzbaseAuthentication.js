const dbTools = require ('../dbTools/dbTools');
const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

var loginHashHashes = {};

async function dizzbaseAuthRequest (req, socket, callback, returnTokenError)
{
    if (req["authRequestType"] == "login")
    {
        return await dizzbaseLogin(req, socket, callback, returnTokenError);
    }
    if (req["authRequestType"] == "logout")
    {
        return {"error": ""};
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
    return;
}

async function dizzbaseLogin(account, socket, returnTokenError) {
    var identifyingField = "user_name";
    var identifyingValue = account["userName"];
    let result = {'responseType': 'login'};
    if (returnTokenError) 
    {
        result.error = returnTokenError;
        result.errorCode = -1;
        socket.emit ('dizzbase_auth_response', result);
        return result;
    }
    if (account["email"] != "") {identifyingField="user_email"; identifyingValue=account["email"];}
    res = await dbTools.getConnectionPoolAdmin().query ('SELECT * FROM dizzbase_user WHERE "'+identifyingField+'" = $1', [identifyingValue]);

    if (res["rowCount"] != 1)
    {
        console.log ("Login attempt with UNKNOWN USER.");
        result.error = "Login attempt with UNKNOWN USER.";
        result.errorCode = 1;
        socket.emit ('dizzbase_auth_response', result);
        return result;
    }
    if (res["rows"][0]["user_verified"] == false)
    {
        console.log ("Login attempt with UNVERIFIED USER.");
        result.error = "Login attempt with UNVERIFIED USER.";
        result.errorCode = 2;
        socket.emit ('dizzbase_auth_response', result);
        return result;
    } 

    match = await argon2.verify(res["rows"][0]["user_pwd_argon2"], account["password"]);
    if (match) {
        //var _pwdHashHash = crypto.createHash('md5').update(res["rows"][0]["user_pwd_argon2"]).digest('hex');
        _uuid = crypto.randomUUID();
        var data = {user_id: res["rows"][0]["user_id"], user_name: res["rows"][0]["user_name"], user_role: res["rows"][0]["user_role"], uuid: _uuid /*, pwdHashHash: _pwdHashHash, */}
        const token = jwt.sign(data, process.env.JWT_SECRET /*, { expiresIn: '1h' }*/);
        result.userID = res["rows"][0]["user_id"];
        result.userName = res["rows"][0]["user_name"];
        result.email = res["rows"][0]["user_email"];
        result.role = res["rows"][0]["user_role"];
        result.verified = res["rows"][0]["user_verified"];
        result.uuid = _uuid;
        result.jwt = token;
        result.error = "";
        result.errorCode = 0;

        socket.emit ('dizzbase_auth_response', result);
    } else {
        console.log ("Login attempt with INCORRCT PASSWORD.");
        result.error = "Login attempt with INCORRECT PASSWORD.";
        socket.emit ('dizzbase_auth_response', result);
        result.errorCode = 3;
    }
    return result;
}

module.exports = { dizzbaseAuthRequest };
