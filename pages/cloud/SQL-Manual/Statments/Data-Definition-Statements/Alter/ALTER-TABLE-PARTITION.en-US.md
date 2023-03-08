---
{
    "title": "ALTER-TABLE-PARTITION",
    "language": "en"
}
---

## ALTER-TABLE-PARTITION

### Name

ALTER TABLE PARTITION

### Description

This statement is used to modify the partition of an existing table.

This operation is synchronous, and the return of the command indicates the completion of the execution.

Syntax:

```sql
ALTER TABLE [database.]table alter_clause;
```

The alter_clause of partition supports the following modification methods

1. Add partition

Syntax:

```sql
ADD PARTITION [IF NOT EXISTS] partition_name
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```

Note:

- partition_desc supports the following two ways of writing
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- The partition is left-closed and right-open interval. If the user only specifies the right boundary, the system will automatically determine the left boundary
- If the bucketing method is not specified, the bucketing method and bucket number used for creating the table would be automatically used
- If the bucketing method is specified, only the number of buckets can be modified, not the bucketing method or the bucketing column. If the bucketing method is specified but the number of buckets not be specified, the default value `10` will be used for bucket number instead of the number specified when the table is created. If the number of buckets modified, the bucketing method needs to be specified simultaneously.
- The ["key"="value"] section can set some attributes of the partition, see [CREATE TABLE](../../Create/CREATE-TABLE)
- If the user does not explicitly create a partition when creating a table, adding a partition by ALTER is not supported

2. Delete partition

Syntax:

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```

 Note:

- At least one partition must be reserved for tables using partitioning.
- After executing DROP PARTITION for a period of time, the deleted partition can be recovered through the RECOVER statement. For details, see SQL Manual - Database Management - RECOVER Statement
- If you execute DROP PARTITION FORCE, the system will not check whether there are unfinished transactions in the partition, the partition will be deleted directly and cannot be recovered, this operation is generally not recommended

3. Modify the partition properties

 Syntax:

```sql
MODIFY PARTITION p1|(p1[, p2, ...]) SET ("key" = "value", ...)
```

Note:

- Currently supports modifying the following attributes of partitions:
  - storage_medium
  -storage_cooldown_time
  - replication_num
  - in_memory
- For single-partition tables, partition_name is the same as the table name.

### Example

1. Add partition, existing partition [MIN, 2013-01-01), add partition [2013-01-01, 2014-01-01), use default bucketing method

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2014-01-01");
```

2. Increase the partition and use the new number of buckets

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
DISTRIBUTED BY HASH(k1) BUCKETS 20;
```

3. Increase the partition and use the new number of replicas

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
("replication_num"="1");
```

4. Modify the number of partition replicas

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION p1 SET("replication_num"="1");
```

5. Batch modify the specified partition

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (p1, p2, p4) SET("in_memory"="true");
```

6. Batch modify all partitions

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (*) SET("storage_medium"="HDD");
```

7. Delete partition

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1;
```

8. Add a partition specifying upper and lower bounds

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES [("2014-01-01"), ("2014-02-01"));
```

### Keywords

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```

### Best Practice
