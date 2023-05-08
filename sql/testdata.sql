\c postgres;
DROP DATABASE IF EXISTS test;
CREATE DATABASE test;
\c test;

CREATE TABLE employee (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(50) NOT NULL,
    employee_email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE "order" (
    order_id SERIAL PRIMARY KEY,
    order_name VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL,
    sales_rep_id INTEGER NOT NULL,
    services_rep_id INTEGER NOT NULL,
    order_date TIMESTAMP NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    order_revenue NUMERIC(10, 2) NOT NULL,
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sales_rp FOREIGN KEY (sales_rep_id) REFERENCES employee (employee_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_services_rep FOREIGN KEY (services_rep_id) REFERENCES employee (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO employee (employee_name, employee_email) VALUES ('ralph', 'ralph@superstore.com');
INSERT INTO employee (employee_name, employee_email) VALUES ('leo', 'leo@superstore.com');
INSERT INTO employee (employee_name, employee_email) VALUES ('lorenz', 'lorenz@superstore.com');
INSERT INTO employee (employee_name, employee_email) VALUES ('joni', 'joni@superstore.com');

INSERT INTO customer (first_name, last_name, email) VALUES ('Tim', 'Tester', 'tim@hostmail.com');
INSERT INTO customer (first_name, last_name, email) VALUES ('John', 'Doe', 'john@live.com');
INSERT INTO customer (first_name, last_name, email) VALUES ('Jane', 'Smith', 'jane@gmail.com');

INSERT INTO "order" (order_name, customer_id, sales_rep_id, services_rep_id, order_date, order_status, order_revenue)
    VALUES ('food', 1, 1, 2, '2023-01-02', 'delivered', 120.00);
INSERT INTO "order" (order_name, customer_id, sales_rep_id, services_rep_id, order_date, order_status, order_revenue)
    VALUES ('hardware', 2, 2, 3, '2023-02-14', 'open', 25.99);
INSERT INTO "order" (order_name, customer_id, sales_rep_id, services_rep_id, order_date, order_status, order_revenue)
    VALUES ('shirts', 3, 1, 3, '2023-03-10', 'open', 35.25);
INSERT INTO "order" (order_name, customer_id, sales_rep_id, services_rep_id, order_date, order_status, order_revenue)
    VALUES ('fruit', 3, 1, 3, '2023-03-12', 'open', 110.25);
INSERT INTO "order" (order_name, customer_id, sales_rep_id, services_rep_id, order_date, order_status, order_revenue)
    VALUES ('drinks', 1, 2, 3, '2023-04-01', 'open', 115.15);

SELECT * FROM pg_create_logical_replication_slot('my_slot', 'pgoutput');
