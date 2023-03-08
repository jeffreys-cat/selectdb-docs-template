---
{
    "title": "DROP-ROLE",
    "language": "en"
}
---

## DROP-ROLE

### Description

This statement is used to remove a role

```sql
  DROP ROLE role1;
````

Removing a role does not deprive the related privileges from users. The deletion only means to decouple the role from users and will not affect the privileges that the users already have.

### Example

1. Drop Role 1

```sql
DROP ROLE role1;
````

### Keywords

    DROP, ROLE

### Best Practice

