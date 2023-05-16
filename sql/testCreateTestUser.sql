/* password hash is for password "my_password" */
INSERT INTO dizzbase_user (user_name, user_email, user_role, user_pwd_argon2, user_verified)
    values ('tim', 'tim@nodomain.com', 'user', '$argon2id$v=19$m=65536,t=3,p=4$ZUbsmM9zBbvMnq58iWMOXQ$frAyiGtAZjtZ6tRTZdrsgnq/G9OtNUe0mOa9gDO3TIw', TRUE);

