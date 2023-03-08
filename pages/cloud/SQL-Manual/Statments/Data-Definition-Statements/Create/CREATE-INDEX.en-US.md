---
{
    "title": "CREATE-INDEX",
    "language": "en"
}
---

## CREATE-INDEX

### Name

CREATE INDEX

### Description

This statement is used to create an index

Syntax:

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP] [COMMENT 'balabala'];
````
Note:
- Currently only supports bitmap indexes
- BITMAP indexes are only created on a single column

### Example

1. Create a bitmap index for siteid on table1

    ```sql
    CREATE INDEX [IF NOT EXISTS] index_name ON table1 (siteid) USING BITMAP COMMENT 'balabala';
    ````


### Keywords

````text
CREATE, INDEX
````

### Best Practice

