---
{
    "title": "DROP-DATABASE",
    "language": "en"
}
---

## DROP-DATABASE

### Name

DROP DATABASE

### Description

This statement is used to delete the database (database)

Syntax:    

```sql
DROP DATABASE [IF EXISTS] db_name [FORCE];
````

Note:

- During the execution of DROP DATABASE, the deleted database can be recovered through the RECOVER statement. See the [RECOVER](../../Database-Administration-Statements/RECOVER) statement for details
- If you execute DROP DATABASE FORCE, the system will not check the database for unfinished transactions and the database will be deleted directly and cannot be recovered, so we do not recommend this operation in most cases

### Example

1. Delete the database db_test
   
     ```sql
     DROP DATABASE db_test;
     ````

### Keywords

     DROP, DATABASE

### Best Practice
