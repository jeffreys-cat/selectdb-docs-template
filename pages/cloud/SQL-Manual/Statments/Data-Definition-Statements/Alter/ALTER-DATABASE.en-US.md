---
{
    "title": "ALTER-DATABASE",
    "language": "en"
}
---

## ALTER-DATABASE

### Name

ALTER DATABASE

### Description

This statement is used to set attributes of the specified database. (administrator only)

1) Set the database data quota, measured in B/K/KB/M/MB/G/GB/T/TB/P/PB

```sql
ALTER DATABASE db_name SET DATA QUOTA quota;
```

2) Rename the database

```sql
ALTER DATABASE db_name RENAME new_db_name;
```

3) Set the quota for the number of copies of the database

```sql
ALTER DATABASE db_name SET REPLICA QUOTA quota;
```

Note:
After renaming the database, if necessary, use the REVOKE and GRANT commands to modify the corresponding user privileges. The default data quota for databases is 1024GB, and the default replica quota is 1073741824.

### Example

1. Set data quota for the specified database

```sql
ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
The above unit is bytes, which is equivalent to
ALTER DATABASE example_db SET DATA QUOTA 10T;

ALTER DATABASE example_db SET DATA QUOTA 100G;

ALTER DATABASE example_db SET DATA QUOTA 200M;
```

2. Rename the database `example_db` to `example_db2`

```sql
ALTER DATABASE example_db RENAME example_db2;
```

3. Set replica quota for the specified database

```sql
ALTER DATABASE example_db SET REPLICA QUOTA 102400;
```

### Keywords

```text
ALTER,DATABASE,RENAME
```

### Best Practice

