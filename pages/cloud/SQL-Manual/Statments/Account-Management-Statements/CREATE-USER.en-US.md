---
{
    "title": "CREATE-USER",
    "language": "en"
}
---

## CREATE-USER

### Name

CREATE USER

### Description

The CREATE USER command is used to create a Doris user.

```sql
CREATE USER [IF EXISTS] user_identity [IDENTIFIED BY 'password']
[DEFAULT ROLE 'role_name']
[password_policy]

user_identity:
    'user_name'@'host'
    
password_policy:

    1. PASSWORD_HISTORY [n|DEFAULT]
    2. PASSWORD_EXPIRE [DEFAULT|NEVER|INTERVAL n DAY/HOUR/SECOND]
    3. FAILED_LOGIN_ATTEMPTS n
    4. PASSWORD_LOCK_TIME [n DAY/HOUR/SECOND|UNBOUNDED]
```

In Doris, one `user_identity` uniquely identifies one user. A  `user_identity` consists of two parts: `user_name` and `host`. The `host` identifies the host address where the client connects. The `host` part can be replaced by`%` for fuzzy matching. If no `host` is specified, this part will be set to `%` by default, which means the user can connect to Doris from any host.

You can also specify the `host` by domain using the following syntax: 'user_name'@['domain']. Doris will consider what is in the square brackets as a domain and try to resolve its IP address. .

If a new user is assigned a role, the user will be automatically granted all the privileges corresponding to the role. If a user is not assigned any roles, then the user will have no privileges by default. Only existing roles can be assigned to users.

`password_policy` is a clause used to specify policies related to password authentication login. Currently, Doris supports the following policies:

1. `PASSWORD_HISTORY`

    This determines whether Doris allows the current user to reset the password to a historical password. For example, `PASSWORD_HISTORY 10` means that the past 10 historical passwords are not allowed to be set as a new password. If it is set to `PASSWORD_HISTORY DEFAULT`, the value in the global variable `password_history` will be used. If it is set to `0` , that means this feature is not enabled. The default value of `PASSWORD_HISTORY` is `0`.

2. `PASSWORD_EXPIRE`

    This is used to set the expiration time of the current user's password. For example, `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password will expire in 10 days. `PASSWORD_EXPIRE NEVER` means that the password will never expire. If it is set to `PASSWORD_EXPIRE DEFAULT`, the value in the global variable `default_password_lifetime` will be used. The default value of `PASSWORD_EXPIRE` is `NEVER` (or `0`), which means the password will never expire.

3. `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`

    These are used to determine after how many login failures the user account will be locked, and how long the lock time is. For example, `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` means that if a user has input wrong passwords for 3 times, the account will be locked for one day.

    A locked account can be actively unlocked using the `ALTER USER` statement.

### Example

1. Create a passwordless user (if no host is specified, the `user_identity` will be jack@'%')

   ```sql
   CREATE USER 'jack';
   ```

2. Create a user with a password and allow login from '172.10.1.10'

   ```sql
   CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
   ```

3. In order to avoid passing plaintext, the above step can also be done as follows

   ```sql
   CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
   The encrypted content can be obtained through PASSWORD(), for example:
   SELECT PASSWORD('123456');
   ```

4. Create a user that is allowed to log in from the '192.168' subnet, and specify its role as `example_role`

   ```sql
   CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
   ```

5. Create a user that is allowed to log in from the domain `example_domain`

   ```sql
   CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
   ```

6. Create a user and assign a role

   ```sql
   CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
   ```
   
7. Create a user, make the password expire after 10 days and the account locked for one day after 3 login failures.

    ```sql
    CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
    ```

8. Create a user and disallow the past 8 historical passwords to be set as a new password.

    ```sql
    CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
    ```

### Keywords

    CREATE, USER

### Best Practice

