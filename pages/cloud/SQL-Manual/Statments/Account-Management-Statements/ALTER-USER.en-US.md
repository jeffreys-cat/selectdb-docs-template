---
{
    "title": "ALTER-USER",
    "language": "en"
}
---

## ALTER-USER

### Name

ALTER USER

### Description

The ALTER USER command is used to modify a user's account attributes, including roles, passwords, and password policies.

```sql
ALTER USER [IF EXISTS] user_identity [IDENTIFIED BY 'password']
[DEFAULT ROLE 'role_name']
[password_policy]

user_identity:
    'user_name'@'host'

password_policy:

    1. PASSWORD_HISTORY [n|DEFAULT]
    2. PASSWORD_EXPIRE [DEFAULT|NEVER|INTERVAL n DAY/HOUR/SECOND]
    3. FAILED_LOGIN_ATTEMPTS n
    4. PASSWORD_LOCK_TIME [n DAY/HOUR/SECOND|UNBOUNDED]
    5. ACCOUNT_UNLOCK
```

About `user_identity` and `password_policy`, please refer to `CREATE USER`.

`ACCOUNT_UNLOCK` is used to unlock a locked user account.

You can only modify one of the following account attributes by one ALTER USER command at a time:

1. Change password
2. Change the role
3. Modify `PASSWORD_HISTORY`
4. Modify `PASSWORD_EXPIRE`
5. Modify `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`
6. Unlock a user account

### Example

1. Change the user's password

	```
	ALTER USER jack@‘%’ IDENTIFIED BY "12345";
	```

2. Change the role of the user

	```
	ALTER USER jack@'192.168.%' DEFAULT ROLE "role2";
	```

3. Modify the user's password policy
	
	```
	ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
	```

4. Unlock a user account

	```
	ALTER USER jack@'%' ACCOUNT_UNLOCK
	```

### Keywords

    ALTER, USER

### Best Practice

1. Change the role

     If a user was assigned Role A and you need to change that, firstly, the system will revoke all privileges corresponding to Role A from the user, and replace them with the privileges corresponding to the new role.

     Note that if the user has been individually granted a certain privilege before, which is included in Role A, that privilege will also be revoked in the role change.

     For example:

     Supposing that Role A has the following privilege: `select_priv on db1.*`, you assign Role A to User 1.

     Then you separately grant the following privilege to User 1: `GRANT select_priv, load_priv on db1.* to user1`

     Supposing that Role B has the following privilege: `alter_priv on db1.tbl1`, you change the role of User 1 to Role B.

     Then at the end, User 1 will have the following privileges: `alter_priv on db1.tbl1` and `load_priv on db1.*` 

2. Modify the password policy

	1. By modifying `PASSWORD_EXPIRE` , you can reset the timing of password expiration.

	2. By modifying `FAILED_LOGIN_ATTEMPTS` or `PASSWORD_LOCK_TIME` , you can unlock the user.