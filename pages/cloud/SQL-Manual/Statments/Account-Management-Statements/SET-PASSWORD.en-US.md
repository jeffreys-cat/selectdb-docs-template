---
{
    "title": "SET-PASSWORD",
    "language": "en"
}
---

## SET-PASSWORD

### Name

SET PASSWORD

### Description

The SET PASSWORD command is used to change a user's login password. If the [FOR user_identity] field does not exist, that means to change the current user's password.

```sql
SET PASSWORD [FOR user_identity] =
    [PASSWORD('plain password')]|['hashed password']
````

Note that the `user_identity` here must be exactly the same as it were created using CREATE USER, otherwise an error will be reported showing that the user does not exist. If the `user_identity` is not specified, the current user will be 'username'@'ip', which may not match any `user_identity`. You can view current users through SHOW GRANTS.

If you use the PASSWORD() method, the password will be passed as a plaintext; if you use a string directly, the password will be passed as an encrypted one.

To modify the passwords of other users, you need administrator privileges.

### Example

1. Change the current user's password

   ```sql
   SET PASSWORD = PASSWORD('123456')
   SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
   ````

2. Change a specified user's password

   ```sql
   SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
   SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
   ````

### Keywords

    SET, PASSWORD

### Best Practice

