---
{
    "title": "ALTER-TABLE-RENAME",
    "language": "en"
}
---

## ALTER-TABLE-RENAME

### Name

ALTER TABLE RENAME

### Description

This statement is used to rename certain names of existing table properties. This operation is synchronous, and the return of the command indicates the completion of the execution.

Syntax:

```sql
ALTER TABLE [database.]table alter_clause;
```

The alter_clause of rename supports modification of the following names

1. Modify the table name

Syntax:

```sql
RENAME new_table_name;
```

2. Modify the rollup index name

 Syntax:

```sql
RENAME ROLLUP old_rollup_name new_rollup_name;
```

3. Modify the partition name

Syntax:

```sql
RENAME PARTITION old_partition_name new_partition_name;
```

4. Modify the column name

Syntax:

```sql
RENAME COLUMN old_column_name new_column_name;
```

Note:
- Currently only tables with column unique id are supported, which are created with property 'light_schema_change'.


### Example

1. Change the table name from table1 to table2

```sql
ALTER TABLE table1 RENAME table2;
```

2. Modify the rollup index named rollup1 in the table example_table to rollup2

```sql
ALTER TABLE example_table RENAME ROLLUP rollup1 rollup2;
```

3. Modify the partition named p1 in the table example_table to p2

```sql
ALTER TABLE example_table RENAME PARTITION p1 p2;
```

4. Modify the column named c1 in the table example_table to c2

```sql
ALTER TABLE example_table RENAME COLUMN c1 c2;
```

### Keywords

```text
ALTER, TABLE, RENAME, ALTER TABLE
```

### Best Practice

