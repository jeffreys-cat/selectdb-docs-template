---
{
    "title": "CREATE-TABLE-AS-SELECT",
    "language": "en"
}
---

## CREATE-TABLE-AS-SELECT

### Name

CREATE TABLE AS SELECT

### Description

This statement creates the table structure by returning the results from the Select statement and imports the data at the same time.

Syntax：

```sql
CREATE TABLE table_name [( column_name_list )]
    opt_engine:engineName
    opt_keys:keys
    opt_comment:tableComment
    opt_partition:partition
    opt_distribution:distribution
    opt_rollup:index
    opt_properties:tblProperties
    opt_ext_properties:extProperties
    KW_AS query_stmt:query_def
```

Note: 

- To execute this command, the user needs to have the `SELECT` privilege for the source table and the `CREATE` privilege for the target database.
- After a table is created, data will be imported. If the import fails, the table will be deleted.
- You can specify the key type. The default key type is `Duplicate Key`

### Example

1. Use the field names in the SELECT statement

    ```sql
    create table `test`.`select_varchar` 
    PROPERTIES(\"replication_num\" = \"1\") 
    as select * from `test`.`varchar_table`
    ```

2. Custom field names (needs to match the number of fields returned)
    ```sql
    create table `test`.`select_name`(user, testname, userstatus) 
    PROPERTIES(\"replication_num\" = \"1\") 
    as select vt.userId, vt.username, jt.status 
    from `test`.`varchar_table` vt join 
    `test`.`join_table` jt on vt.userId=jt.userId
    ```

### Keywords

    CREATE, TABLE, AS, SELECT

### Best Practice

