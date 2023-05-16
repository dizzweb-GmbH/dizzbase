const pg = require ('pg');
const fs = require('fs');
const path = require('path');

async function initDizzbaseAdmin (pool) {

    var res;
    res = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dizzbase_user')");

    if (res.rows[0].exists == false)
    {
        console.log ("dizzbase admin tables not found - running dizzbase db init script dizzbaseDBInit.sql")
        try {

            const dizzbaseDBInit1 = path.join(__dirname, '../sql/dizzbaseDBInit1.sql');
            pkey_query = fs.readFileSync (dizzbaseDBInit1, 'ascii');
            res = await pool.query (pkey_query);
    
            const dizzbaseDBInit2 = path.join(__dirname, '../sql/dizzbaseDBInit2.sql');
            pkey_query = fs.readFileSync (dizzbaseDBInit2, 'ascii');
            res = await pool.query (pkey_query);
    
            const dizzbaseDBInit3 = path.join(__dirname, '../sql/dizzbaseDBInit3.sql');
            pkey_query = fs.readFileSync (dizzbaseDBInit3, 'ascii');
            res = await pool.query (pkey_query);
                
        } catch (error) {            
            console.error ("ERROR in initDizzbaseAdmin: " + error);            
        }
    }

    console.log ('dizzbase admin initialized.');
}

module.exports = { initDizzbaseAdmin };
