# dizzbase
Realtime postgreSQL backend-as-a-service for node.js express servers.
Clients (flutter/dart or JavaScript/React) can send query that are automatically updated in realtime.
The package can be an alternative to self-hosting supabase if a lightweight and easy to install solution is needed.
Also, it can be used instead of firebase if you need a relational rather than document database. 

Client packages:
   - dizzbase-client npm package for JavaScript (eg for React)
   - dizzbase-client pub.dev package for flutter/dart.

## Postgres configuration
Enable logical decoding in your PostgreSQL database by updating the postgresql.conf configuration file: 
   ```
   wal_level = logical 
   max_replication_slots = 5 
   max_wal_senders = 5
   ```

Create your own database and a user for the database. dizzbase requires two user:
- A superuser (usually user "postgres") with full right for the admin tables (eg. user management). Admin tables are created automatically.
- A normal user that owns the applications tables in the database and does not have superuser privileges. This user MUST NOT have access to the dizz_* admin tables.

To create the non-superuser, you can execute something like this:
```SQL
   CREATE USER my_user WITH PASSWORD 'my-strong-password';
   GRANT ALL PRIVILEGES ON DATABASE my_db TO my_user;
   GRANT CREATE ON DATABASE my_db TO my_user;
```
Then use my_user (not the superuser!) to create your applications database tables.  

Test/demo database: Instead of creating your own database you can also use a provided script to create a test/demo database that works with the flutter and JavaScript client.
Install the demo data into the demo database before (!!!) you start the backend for the first time by running the shell script sql/testResetDB.sh included in the dizzbase npm module. You can also get the script from github https://github.com/dizzweb-GmbH/dizzbase. The shell script uses some of the *.sql files in the sql folder, so start it ```/bin/sh testResetDB.sql``` in the sql directory.

## Installation
Install the module locally ```npm install dizzbase``` to ensure the module can load auxilliary files at runtime.

(If you want to develop dizzbase, download the code from github and install the required packages: ```npm install express socket.io pg-logical-replication dotenv argon2 jsonwebtoken```)

## Configuration of the backend server

Configure the database access in the .env file of your Node.js project, for example:
```
POSTGRES_USER=my_user
POSTGRES_PASSWORD=my-strong-password

POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=postgres

POSTGRES_DB_NAME=my_db
POSTGRES_DB_HOST=localhost
POSTGRES_DB_PORT=5432
```
## Enabling authentication

To enable authentication, set your JWT secret in the .env file:
   ```
   JWT_SECRET=your-jwt-secret-do-not-share
   ```

## SQL injection protection and backend access to the database.

All API calls are SQL-injection protected - with the exception of ```DizzbaseDirectSQL()```. Therefore, this API is disabled by default. To enable it (for eg. debugging) add to your .env file:

```
DIZZBASE_DIRECT_SQL_ENABLED=1
```

If your backend (eg. your express endpoints) need access to the databases, you can call ```getDBConnection()``` to get a non-admin SQL connection for use with the "pg" package.

## Starting the backend server from your index.js file

The initialization of the dizzbase server requires accessing the database and is therefore executed async. To start the server simply do something like this:
```js
const { Console } = require('console');
const dizzbase = require ('dizzbase');

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

app.get('/', (req, res) => {
   res.send ("Hello, world!");
});

console.log (__dirname);

// This block ensures proper initialization order - start the TCP listener after everything has been initialized:
(async () => {
   // Start the dizzbase Socket.io server and initialize
   await dizzbase.dizzbaseExpressServer(server);
   
   // do not move out of this async block to ensure everything is initialized properly
   server.listen(3000, () => {
      console.log('listening on *:3000');
   });    
})()
```

## Common problems

- If you get an error like "Uncaught database error: role 'dizz' does not exist" you are probably missing the .env file with the database connection parameters.
- "error: replication slot dizzbase_slot" or an error mentioning the publication pgoutput_dizzbase_pub might indicate that you did not create publication/replication (or created them in the wrong database) or that the statements were executed in the wrong order.
- If you receive an error like "PUBLICATION already exists" or "REPLICATION SLOT already exisits" you need to manually remove them (note that they might be in a different database!) - use ```DROP PUBLICATION ...``` and ```SELECT pg_drop_replication_slot('...')```.

## TODO
- Server requires express - add feature run as stand alone socket.io server

