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

## Getting started

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

   Create a publication for your database - the publication must be named pgoutput_dizzbase_pub:
      - CREATE PUBLICATION pgoutput_dizzbase_pub FOR ALL TABLES; -- CREATE PUBLICATION NEED TO BE BEFORE SLOT CREATION

   In create replication slot for your database - the repliation slot must be named dizzbase_slot:
      - SELECT * FROM pg_create_logical_replication_slot('dizzbase_slot', 'pgoutput');

## TODO
- SQL Parameter Binding instead of SQL String literals - in dizzbaseTransactions.j and dizzbaseQuery.js
- SQL injection attack prevention
- The client can automatically disconnect/reconnect at any time (this is a Socket.IO feature). How are the dizzbaseConnection objects on the client and on the server rebuild in this case
- dizzbaseTransaction.js Insert/Update: Check for error if the number of field and values are not equal
- Server port is hard-wired to TCP:3000
- Currently no SSL support
- Server requires express - add feature run as stand alone socket.io server

