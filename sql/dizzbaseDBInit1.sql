DROP TABLE IF EXISTS dizzbase_user;

CREATE TABLE dizzbase_user (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) UNIQUE NOT NULL,
    user_email VARCHAR(100) UNIQUE NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    user_pwd_argon2 varchar (200) NOT NULL,
    user_verified BOOLEAN,
    user_auth_type varchar (20) DEFAULT 'local'
);

/* password hash is for password "admin" */
INSERT INTO dizzbase_user (user_name, user_email, user_role, user_pwd_argon2, user_verified)
    values ('admin', 'admin@nodomain.com', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$LAveywgbzvxBpYGS+SfiXg$HeGMUpyCfUEvTX+fxue9VOoVpySsdoGTNSE3bwHHdtE', TRUE);
