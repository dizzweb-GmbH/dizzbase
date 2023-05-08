# dizzbase
Realtime postgreSQL tool for node js.´

# Notifier 
https://www.npmjs.com/package/pubsub-js

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


