---
{
    "title": "REVOKE",
    "language": "en"
}
---

## REVOKE

### Name

REVOKE

### Description

The REVOKE command is used to revoke the privileges assigned to the specified user or role.

```sql
REVOKE privilege_list ON db_name[.tbl_name] FROM user_identity [ROLE role_name]

REVOKE privilege_list ON RESOURCE resource_name FROM user_identity [ROLE role_name]
````

`user_identity`:

The `user_identity` syntax here is the same as that of CREATE USER. The `user_identity` here must be an existing one. The `host` in `user_identity` can be a domain. If it is a domain, it might take about 1 minute for the privileges to be revoked.

You can also revoke privileges of a specified role, and the role must be an existing one.

### Example

1. Revoke a privilege of user `jack` on database `testDb`

    ```sql
    REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
    ````

2. Revoke access to `spark_resource` from user `jack` 

    ```sql
    REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
    ````

### Keywords

    REVOKE

### Best Practice

