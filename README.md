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
- A superuser (usually user "postgres") with full right for the admin tables (eg. user management). Admin tables will be created automatically and have the prefix dizzbase_ in their name.
- A normal user that owns the applications tables in the database and does not have superuser privileges. This user MUST NOT have access to the dizz_* admin tables.

To create the non-superuser, you can execute something like this:
```SQL
   CREATE USER my_user WITH PASSWORD 'my-strong-password';
   GRANT ALL PRIVILEGES ON DATABASE my_db TO my_user;
   GRANT CREATE ON DATABASE my_db TO my_user;
```
Then use my_user (not the superuser!) to create your applications database tables.  

Next, as the superuser, create a publication for your database - the publication must be named pgoutput_dizzbase_pub.
Then (in that order) create a replication slot for your database - the repliation slot must be named dizzbase_slot:
```SQL
   CREATE PUBLICATION pgoutput_dizzbase_pub FOR ALL TABLES; -- CREATE PUBLICATION NEED TO BE BEFORE SLOT CREATION
   SELECT * FROM pg_create_logical_replication_slot('dizzbase_slot', 'pgoutput');
```

Test/demo database: Instead of creating your own database you can also use a script to create a test/demo database that works with the flutter and JavaScript client.
To create the demo database log in to postgresql with psql and execute the file node_modules/dizzbase/sql/testdata.sql with the following psql meta-command:
```\i node_modules/dizzbase/sql/testdata.sql```
This will also take care of creating the publication and slot a per below.

## Installation
Install the module locally ```npm install dizzbase``` to ensure the module can load auxilliary files at runtime.

(If you want to develop dizzbase, download the code from github and install the required pacakges: ```npm install express socket.io pg-logical-replication dotenv argon2 jsonwebtoken```)

## Configuration of the backend server

Configure the database access in the .env file of your Node.js project, for example:
```
   POSTGRES_USER=my_user
   POSTGRES_PASSWORD=my-strong-password

   POSTGRES_SUPERUSER_USER=postgres
   POSTGRES_SUPERUSER_PASSWORD=postgres

   POSTGRES_DB_NAME=my_db
   POSTGRES_DB_HOST=localhost
   POSTGRES_DB_PORT=5432
```
## Enabling JWT Bearer token authentication

To enable authentication, set your JWT secret in the .env file:
   ```
   JWT_SECRET=your-jwt-secret-do-not-share
   ```
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

- If you get an error like "Uncaught database error: role "dizz" does not exist" you are probably missing the .env file with the database connection parameters.
- "error: replication slot dizzbase_slot" or an error mentioning the publication pgoutput_dizzbase_pub might indicate that you did not create publication/replication (or created them in the wrong database) or that the statements were executed in the wrong order.

## TODO
- SQL Parameter Binding instead of SQL String literals - in dizzbaseTransactions.j and dizzbaseQuery.js
- SQL injection attack prevention
- The client can automatically disconnect/reconnect at any time (this is a Socket.IO feature). How are the dizzbaseConnection objects on the client and on the server rebuild in this case
- dizzbaseTransaction.js Insert/Update: Check for error if the number of field and values are not equal
- Currently no SSL support
- Server requires express - add feature run as stand alone socket.io server

