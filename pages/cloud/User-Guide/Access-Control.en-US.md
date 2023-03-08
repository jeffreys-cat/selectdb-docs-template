# Access Control

The access control system of SelectDB refers to the implementation  of MySQL which achieves fine-grained permissions at the table level, role-based  access control, and supports the whitelist mechanism.

## Glossary

1. User ID user_identity

   In the authority system, a user is identified as a User Identity (user identity). A user ID consists of two parts: username and userhost. Among them, username is the user name, which is composed of uppercase and lowercase letters in English. userhost indicates the IP from which the user link comes from. user_identity is represented as username@'userhost', which means username from userhost.

   Another representation of user_identity is username@ ['domain'] , where domain is the domain name, which can be reversely resolved to a set of ip through DNS. Finally, it is expressed as a set of username@'userhost', so we will use username@'userhost' to represent it later.

2. Permissions privilege

   The objects that permissions act on are nodes, data directories, databases, or tables. Different permissions represent different operating permissions.

3. Role

   Users can create custom named roles. A role can be viewed as a collection of permissions. A newly created user can be assigned a certain role, and will be automatically assigned the permissions of the role. Subsequent permission changes to the role will also be reflected in all user permissions belonging to the role.

4. User property user_property

   User attributes are directly attached to a user, not a user ID. That is, both cmy@'192.%' and cmy@ ['domain'] have the same set of user attributes, which belong to user cmy, not cmy@'192.%' or cmy@ ['domain'] .

   User attributes include but are not limited to: the maximum number of user connections, importing cluster configuration, etc.

## Supported operations

1. Create a user: CREATE USER
2. Delete user: DROP USER
3. Authorization: GRANT
4. Revocation: REVOKE
5. Create a role: CREATE ROLE
6. Delete a role: DROP ROLE
7. View current user permissions: SHOW GRANTS
8. View all user permissions: SHOW ALL GRANTS
9. View created roles: SHOW ROLES
10. View user properties: SHOW PROPERTY

## Permission type

The following permissions are currently supported

1. Node_priv

   Node change permissions. Including operations such as adding and deleting computing nodes.

   Currently, only the management and control platform of SelectDB has this permission.

2. Grant_priv

   Permissions Change permissions. Allows operations including authorization, revoking rights, adding/deleting/changing users/roles, etc.

   But a user with this permission can not grant node_priv permission to other users, unless the user itself has node_priv permission.

3. Select_priv

   Read-only access to databases, tables.

4. Load_priv

   Write permissions on databases and tables. Including Load, Insert, Delete, etc.

5. Alter_priv

   Alter permissions on databases, tables. Including operations such as renaming libraries/tables, adding/deleting/altering columns, adding/deleting partitions, etc.

6. Create_priv

   Permission to create databases, tables, and views.

7. Drop_priv

   Delete permissions for databases, tables, and views.

8. Usage_priv

   resource usage rights.

## Permission level

At the same time, according to the scope of application of permissions, we divide the permissions of library tables into the following four levels:

1. GLOBAL LEVEL: Global permissions. That is, permissions `*.*.*`on . Granted privileges apply to any table in any database.
2. CATALOG LEVEL: Data directory (Catalog) level permissions. That is, permissions `ctl.*.*`on . The granted permissions apply to any library table in the specified Catalog.
3. DATABASE LEVEL: Database-level permissions. That is, permissions `ctl.db.*`on . The granted privileges apply to any table in the specified database.
4. TABLE LEVEL: Table-level permissions. That is, permissions `ctl.db.tbl`on . The privileges granted apply to the specified table in the specified database.

Divide resource permissions into the following two levels:

1. GLOBAL LEVEL: Global permissions. That is, permissions `*`on . The granted permissions apply to the resource.
2. RESOURCE LEVEL: Resource level permissions. That is, permissions `resource_name`on . The granted permissions apply to the specified resource.

## ADMIN/GRANT permission description

The ADMIN_PRIV and GRANT_PRIV permissions have the **authority to grant permissions** at the same time, which is special. Here, the operations related to these two permissions are explained one by one.

1. CREATE USER
   - Users with ADMIN authority, or GRANT authority at the GLOBAL and DATABASE levels, can create new users.
2. DROP USER
   - Users with ADMIN authority or GRANT authority at the global level can delete users.
3. CREATE/DROP ROLE
   - Users with ADMIN authority or GRANT authority at the global level can create roles.
4. GRANT/REVOKE
   - Users with ADMIN authority or GLOBAL level GRANT authority can grant or revoke the authority of any user.
   - Users with the GRANT authority at the CATALOG level can grant or revoke any user's authority to the specified CATALOG.
   - Users with DATABASE level GRANT authority can grant or revoke any user's authority to the specified database.
   - A user with TABLE level GRANT authority can grant or revoke any user's authority to a specified table in a specified database.
5. SET PASSWORD
   - Users with ADMIN authority or GLOBAL-level GRANT authority can set passwords for any user.
   - Ordinary users can set their own corresponding UserIdentity password. The corresponding UserIdentity can be viewed through the `SELECT CURRENT_USER();`command .
   - Users with non-GLOBAL level GRANT permissions cannot set the passwords of existing users, and can only specify passwords when creating users.

## Some instructions

1. When the warehouse is initialized, the following users and roles are automatically created:

   1. Operator role: This role has Node_priv and Admin_priv, that is, all permissions to Doris.
   2. admin role: This role has Admin_priv, that is, all permissions except node changes.
   3. root@'%': root user, allowed to log in from any node, the role is operator, this role is currently only available to the management and control platform.
   4. admin@'%': admin user, allowed to log in from any node, the role is admin.

2. Deleting or changing the permissions of roles or users created by default is not supported.

3. There is only one user with the operator role, that is, Root. Users with admin role can create more than one.

4. Some operating instructions that may create conflicts

   1. Domain name conflicts with ip:

      Suppose the following users are created:

      CREATE USER cmy@['domain'];

      And authorize:

      GRANT SELECT_PRIV ON *.* TO cmy@['domain']

      The domain is resolved to two ip: ip1 and ip2

      After the assumption, we perform a separate authorization on cmy@'ip1':

      GRANT ALTER_PRIV ON *.* TO cmy@'ip1';

      Then the permission of cmy@'ip1' will be changed to SELECT_PRIV, ALTER_PRIV. And when we change the permission of cmy@ ['domain'] again, cmy@'ip1' will not follow the change.

   2. Duplicate ip conflict:

      Suppose the following users are created:

      CREATE USER cmy@'%' IDENTIFIED BY "12345";

      CREATE USER cmy@'192.%' IDENTIFIED BY "abcde";

      In terms of priority, '192.%' takes precedence over '%', so when user cmy tries to log in to Doris with password '12345' from the machine 192.168.1.1, it will be rejected.

5. forgot admin password

   If you forget the admin password and cannot log in, you can reset the admin password on the management and control platform.

6. ADMIN_PRIV privileges can only be granted or revoked at the GLOBAL level.

7. Owning GRANT_PRIV at the GLOBAL level is actually equivalent to owning ADMIN_PRIV, because GRANT_PRIV at this level has the authority to grant arbitrary permissions, please use it with caution.

8. `current_user()`and`user()`

   Users `SELECT current_user();`can `SELECT user();`view `current_user`and `user`. Among them, `current_user`indicates which identity the current user has passed through the authentication system, and `user`is the actual current user `user_identity`. for example:

   Assuming that `user1@'192.%'`this , and then the user user1 from 192.168.10.1 logs in the system, then at this time `current_user`is `user1@'192.%'`and `user`is `user1@'192.168.10.1'`.

   All permissions are given to a `current_user`certain , and real users have `current_user`all the permissions of the corresponding .

9. password strength

   In the upcoming version, the function of verifying the strength of the user's password will be added. This functionality is `validate_password_policy`controlled . The default is `NONE/0`, that is, no password strength checks are performed. If set to `STRONG/2`, the password must contain 3 items among "uppercase letters", "lowercase letters", "numbers" and "special characters", and the length must be greater than or equal to 8.

## Best practice

Here are some examples of usage scenarios of the permission system.

1. scene one

   Cluster users are divided into administrators (Admin), development engineers (RD) and users (Client). Among them, the administrator has all the permissions of the entire cluster, and is mainly responsible for cluster construction and node management. Development engineers are responsible for business modeling, including building databases and tables, importing and modifying data, etc. Users access different databases and tables to fetch data.

   In this scenario, administrators can be given ADMIN authority or GRANT authority. Grant CREATE, DROP, ALTER, LOAD, SELECT permissions to any or specified database table to RD. Grant Client the SELECT permission on any or specified database table. At the same time, you can also simplify authorization operations for multiple users by creating different roles.

2. scene two

   There are multiple businesses in a cluster, and each business may use one or more data. Each business needs to manage its own users. In this scenario. The administrator user can create a user with DATABASE-level GRANT privileges for each database. This user can only authorize the specified database for the user.

3. blacklist

   SelectDB itself does not support blacklist, only whitelist function, but we can simulate blacklist in some ways. Assuming that `user@'192.%'`a , it means that `192.*`users from are allowed to log in. At this time, if you want to prohibit users `192.168.10.1`from logging in. Then you can create another `cmy@'192.168.10.1'`user user and set a new password. Because `192.168.10.1`has a higher priority than `192.%`, from `192.168.10.1`will no longer be able to log in with the old password.

## More help

For more detailed syntax and best practices of privilege management, please refer to the Grant statement in the SQL manual.
