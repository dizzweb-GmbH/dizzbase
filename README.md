# dizzbase
Realtime postgreSQL tool for node js.´

# Notifier 

# Todo
    1. Install dotenv package 
    2. Create .env file 
    3. Fill out the following variables with your values:
       - POSTGRES_USER
       - POSTGRES_PASSWORD
       - POSTGRES_DB_NAME
       - POSTGRES_DB_HOST
       - POSTGRES_DB_PORT

# Postgres 
    Install: 
      - sudo apt-get install postgresql-14-wal2json
    Enable logical decoding in your PostgreSQL database by updating the postgresql.conf configuration file: 
       - wal_level = logical 
       - max_replication_slots = 5 
       - max_wal_senders = 5

    In PSQL, create replication slot:
       - SELECT * FROM pg_create_logical_replication_slot('my_slot_json', 'wal2json');
        (or, without Plugin and JSON: SELECT * FROM pg_create_logical_replication_slot('my_slot', 'pgoutput'));

       - Den Namen z.B. my_slot_json kann man frei vergeben, dann in Node für die subscription nutzen.
      
        JSON Plug für Postgres installieren:
        sudo apt-get install postgresql-14-wal2json

## TO DO
- SQL Parameter Binding instead of SQL String literals - in dizzbaseTransactions.j and dizzbaseQuery.js
- SQL injection attack prevention
- The client can automatically disconnect/reconnect at any time (this is a Socket.IO feature). How are the dizzbaseConnection objects on the client and on the server rebuild in this case
- dizzbaseTransaction.js Insert/Update: Check for error if the number of field and values are not equel
- General error handling: How are exceptions caucht in the backend and how are they communicated back to the client
