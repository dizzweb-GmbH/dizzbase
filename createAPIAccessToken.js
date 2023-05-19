const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log ("Run this script from a location with access to the .env file that contains your JWT secret.");
console.log ("Use the token for your dizzbase client configuration.");

var data = {user_id: 0, user_name: "", user_role: "api", uuid: ""}
const token = jwt.sign(data, process.env.JWT_SECRET /*, { expiresIn: '1h' }*/);

console.log (process.env.JWT_SECRET);
console.log (token);
