# dizzbase
Realtime postgreSQL backend-as-a-service for node.js express servers.
Clients (flutter/dart or JavaScript/React) can send query that are automatically updated in realtime.
The package can be an alternative to self-hosting supabase if a lightweight and easy to install solution is needed.
Also, it can be used instead of firebase if you need a relational rather than document database. 

Client packages:
   - dizzbase-client npm package for JavaScript (eg for React)
   - dizzbase-client pub.dev package for flutter/dart.

## Required packages
npm install express socket.io pg-logical-replication dotenv

## Configuration of the backend server

   Configure the database access in the .env file of your Node.js project, for example:

   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB_NAME=myDB
   POSTGRES_DB_HOST=localhost
   POSTGRES_DB_PORT=5432

## Postgres configuration
    Enable logical decoding in your PostgreSQL database by updating the postgresql.conf configuration file: 
      - wal_level = logical 
      - max_replication_slots = 5 
      - max_wal_senders = 5

   Test/demo database: Instead of creating your own database you can also use a script to create a test/demo database that works with the flutter and JavaScript client.
   To create the demo database log in to postgresql with psql and execute the file node_modules/dizzbase/sql/testdata.sql with the following psql meta-command:
      \i node_modules/dizzbase/sql/testdata.sql
   This will also take care of creating the publication and slot a per below.

   Create a publication for your database - the publication must be named pgoutput_dizzbase_pub.
   Then (in that order) create a replication slot for your database - the repliation slot must be named dizzbase_slot:

      CREATE PUBLICATION pgoutput_dizzbase_pub FOR ALL TABLES; -- CREATE PUBLICATION NEED TO BE BEFORE SLOT CREATION
      SELECT * FROM pg_create_logical_replication_slot('dizzbase_slot', 'pgoutput');

## Starting the backend server from your index.js file

   To start the server simply do something like this:

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

## TODO
- SQL Parameter Binding instead of SQL String literals - in dizzbaseTransactions.j and dizzbaseQuery.js
- SQL injection attack prevention
- The client can automatically disconnect/reconnect at any time (this is a Socket.IO feature). How are the dizzbaseConnection objects on the client and on the server rebuild in this case
- dizzbaseTransaction.js Insert/Update: Check for error if the number of field and values are not equal
- Server port is hard-wired to TCP:3000
- Currently no SSL support
- Server requires express - add feature run as stand alone socket.io server

