---
{
    "title": "GRANT",
    "language": "en"
}
---

## GRANT

### Name

GRANT

### Description

The GRANT command is used to grant a role or privileges to a specified user.

```sql
GRANT privilege_list ON priv_level TO user_identity [ROLE role_name]

GRANT privilege_list ON RESOURCE resource_name TO user_identity [ROLE role_name]
````

`privilege_list` is a list of privileges to be granted, separated by commas. Currently, Doris supports the following privileges:

    NODE_PRIV: permission to perform cluster node operation permissions, including node online and offline operations. Only the root user can be granted this privilege.
    ADMIN_PRIV: all privileges except NODE_PRIV
    GRANT_PRIV: permission to perform operations, including creating and deleting users, roles, authorization and deauthorization, and setting passwords
    SELECT_PRIV: permission to read specific databases or tables
    LOAD_PRIV: permission to load data into specific databases or tables
    ALTER_PRIV: permission to alter the schema of specific databases or tables
    CREATE_PRIV: permission to create specific databases or tables
    DROP_PRIV: permission to remove specific databases or tables
    USAGE_PRIV: permission to use specific resources
    
    The ALL and READ_WRITE privileges in the old versions will be converted to: SELECT_PRIV,LOAD_PRIV,ALTER_PRIV,CREATE_PRIV,DROP_PRIV;
    READ_ONLY will be converted to SELECT_PRIV.

Privilege classification:

    1. Node Privileges: NODE_PRIV
    2. Database and Table Privileges: SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV
    3. Resource Privileges: USAGE_PRIV

`priv_level` supports the following 4 levels:

    1. *.*.* privileges apply to all catalogs and all the databases and tables in them
    2. ctl.*.* privileges apply to all databases and tables in the specified catalog
    3. ctl.db.* privileges apply to all tables in the specified database
    4. ctl.db.tbl privileges apply to the specified table in the specified database
    
    The catalog, database, and table here can be non-existent ones.

`resource_name` supports the following two forms:

    1. * privileges apply to all resources
    2. resource privileges apply to the specified resources
    
    The specified resources here can be non-existent ones.

`user_identity`:

    The user_identity syntax here is the same as that of CREATE USER. The user_identity here must be an existing one. The host in user_identity can be a domain. If it is a domain, it might take about 1 minute for the granted privileges to take effect.
    
    You can also assign privileges to a specified ROLE. If the ROLE is non-existent, it will be created automatically.

### Example

1. Grant a privilege that applies to all catalog, databases and tables to a user

   ```sql
   GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
   ````

2. Grant privileges that applies to a specified database table to a user

   ```sql
   GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1 TO 'jack'@'192.8.%';
   ````

3. Grant a privilege that applies to a specified database table to a role

   ```sql
   GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
   ````

4. Grant access to all resources to a user

   ```sql
   GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
   ````

5. Grant access to the specified resources to a user

   ```sql
   GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
   ````

6. Grant access to the specified resources to a role

   ```sql
   GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
   ````

### Keywords

    GRANT

### Best Practice

