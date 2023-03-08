---
{
    "title": "LDAP",
    "language": "en"
}
---

## LDAP

### Name

LDAP

### Description

SET LDAP_ADMIN_PASSWORD

```sql
  SET LDAP_ADMIN_PASSWORD = PASSWORD('plain password')
````

 The SET LDAP_ADMIN_PASSWORD command is used to set the LDAP administrator password. When using LDAP authentication, Doris needs to use the administrator account and password to query the information of the login user from the LDAP service.

### Example

1. Set the LDAP administrator password

```sql
SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
````

### Keywords

     LDAP, PASSWORD, LDAP_ADMIN_PASSWORD

### Best Practice
