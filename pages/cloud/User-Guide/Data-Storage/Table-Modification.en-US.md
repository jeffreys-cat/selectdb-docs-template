# Table Modification

## Schema Change

Users can modify the schema of an existing table through the Schema Change operation. The following modifications are currently supported:

- Add and delete columns
- modify column type
- Adjust column order
- Add and modify BloomFilter Index
- Add and delete Bitmap Index

This document mainly introduces how to create a Schema Change job, as well as some precautions and common problems of Schema Change.

The basic process of executing Schema Change is to generate a new Schema Index data through the original Index data. Among them, two parts of data conversion are mainly required, one is the conversion of existing historical data, and the other is the conversion of newly arrived imported data during the execution of Schema Change.

```text
+----------+
| Load Job |
+----+-----+
     |
     | Load job generates both origin and new index data
     |
     |      +------------------+ +---------------+
     |      | Origin Index     | | Origin Index  |
     +------> New Incoming Data| | History Data  |
     |      +------------------+ +------+--------+
     |                                  |
     |                                  | Convert history data
     |                                  |
     |      +------------------+ +------v--------+
     |      | New Index        | | New Index     |
     +------> New Incoming Data| | History Data  |
            +------------------+ +---------------+
```



Before starting to convert historical data, SelectDB will get a latest Transaction ID. And wait for all import transactions before this Transaction ID to complete. This Transaction ID becomes a watershed. It means that SelectDB guarantees that all import tasks after the watershed will generate data for the original Index and the new Index at the same time. In this way, after the conversion of historical data is completed, the data in the new Index can be guaranteed to be complete.

### Create job

For the specific syntax of creating a Schema Change, please refer to ALTER TABLE COLUMN description of the Schema Change section in the SQL Manual.

The job creation of Schema Change is an asynchronous process. After the job is successfully submitted, the user needs to check the progress of the job through `SHOW ALTER TABLE COLUMN`commands .

### Show job

`SHOW ALTER TABLE COLUMN`You can view the currently executing or completed Schema Change jobs. When a Schema Change job involves multiple Indexes, this command will display multiple lines, each line corresponding to an Index. Examples are as follows:

```sql
mysql> SHOW ALTER TABLE COLUMN\G;
*************************** 1. row ***************************
        JobId: 20021
    TableName: tbl1
   CreateTime: 2019-08-05 23:03:13
   FinishTime: 2019-08-05 23:03:42
    IndexName: tbl1
      IndexId: 20022
OriginIndexId: 20017
SchemaVersion: 2:792557838
TransactionId: 10023
        State: FINISHED
          Msg: 
     Progress: NULL
      Timeout: 86400
1 row in set (0.00 sec)
```

- JobId: Unique ID for each Schema Change job.
- TableName: The table name of the base table corresponding to the Schema Change.
- CreateTime: job creation time.
- FinishedTime: Job finish time. If not completed, "N/A" is displayed.
- IndexName: The name of an Index involved in this modification.
- IndexId: the unique ID of the new Index.
- OriginIndexId: the unique ID of the old Index.
- SchemaVersion: displayed in M:N format. Among them, M represents the version of this Schema Change, and N represents the corresponding Hash value. Every time Schema Change, the version will be incremented.
- TransactionId: The watershed transaction ID for converting historical data.
- State: The stage of the job.
  - PENDING: The job is waiting in the queue to be scheduled.
  - WAITING_TXN: Waiting for the import task before the watershed transaction ID to complete.
  - RUNNING: Historical data conversion is in progress.
  - FINISHED: The job was successful.
  - CANCELLED: The job failed.
- Msg: If the job fails, the failure message will be displayed here.
- Progress: job progress. Progress is only shown in the RUNNING state. The progress is displayed in the form of M/N. Where N is the total number of replicas involved in Schema Change. M is the number of replicas that have completed historical data conversion.
- Timeout: job timeout. The unit is second.

### Cancel job

In case the job status is not FINISHED or CANCELLED, the Schema Change job can be canceled by the following command:

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

### Multiple modifications in one job

Schema Change can make different modifications to multiple ROLLUPs in one job. Examples are as follows:

Source Schema:

```text
+-----------+-------+------+------+------+---------+-------+
| IndexName | Field | Type | Null | Key  | Default | Extra |
+-----------+-------+------+------+------+---------+-------+
| tbl1      | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k3    | INT  | No   | true | N/A     |       |
|           |       |      |      |      |         |       |
| rollup2   | k2    | INT  | No   | true | N/A     |       |
|           |       |      |      |      |         |       |
| rollup1   | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
+-----------+-------+------+------+------+---------+-------+
```



You can add a row of k4 to both rollup1 and rollup2, and add a row of k5 to rollup2 through the following commands:

```sql
ALTER TABLE tbl1
ADD COLUMN k4 INT default "1" to rollup1,
ADD COLUMN k4 INT default "1" to rollup2,
ADD COLUMN k5 INT default "1" to rollup2;
```



When complete, the Schema becomes:

```text
+-----------+-------+------+------+------+---------+-------+
| IndexName | Field | Type | Null | Key  | Default | Extra |
+-----------+-------+------+------+------+---------+-------+
| tbl1      | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k3    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
|           | k5    | INT  | No   | true | 1       |       |
|           |       |      |      |      |         |       |
| rollup2   | k2    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
|           | k5    | INT  | No   | true | 1       |       |
|           |       |      |      |      |         |       |
| rollup1   | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
+-----------+-------+------+------+------+---------+-------+
```



It can be seen that the Base table tbl1 also automatically adds k4 and k5 columns. That is, the columns added to any rollup will be automatically added to the Base table.

At the same time, it is not allowed to add columns that already exist in the Base table to Rollup. If users need to do this, they can re-create a Rollup containing the new columns, and then delete the original Rollup.

### Modify the key column

Modifying the Key column of a table is done through `key`keywords , let's look at an example below.

**This usage is only for the key column of the Duplicate key table**

Source Schema:

```text
+-----------+-------+-------------+------+------+---------+-------+
| IndexName | Field | Type        | Null | Key  | Default | Extra |
+-----------+-------+-------------+------+------+---------+-------+
| tbl1      | k1    | INT         | No   | true | N/A     |       |
|           | k2    | INT         | No   | true | N/A     |       |
|           | k3    | varchar(20) | No   | true | N/A     |       |
|           | k4    | INT         | No   | false| N/A     |       |
+-----------+-------+-------------+------+------+---------+-------+
```



Modify the statement as follows, we change the degree of column k3 to 50

```sql
alter table example_tbl modify column k3 varchar(50) key null comment 'to 50'
```



When complete, the Schema becomes:

```text
+-----------+-------+-------------+------+------+---------+-------+
| IndexName | Field | Type        | Null | Key  | Default | Extra |
+-----------+-------+-------------+------+------+---------+-------+
| tbl1      | k1    | INT         | No   | true | N/A     |       |
|           | k2    | INT         | No   | true | N/A     |       |
|           | k3    | varchar(50) | No   | true | N/A     |       |
|           | k4    | INT         | No   | false| N/A     |       |
+-----------+-------+-------------+------+------+---------+-------+
```



Because the Schema Change job is an asynchronous operation, only one Schema change job can be performed on the same table at the same time. To check the job running status, you can use the following command

```sql
SHOW ALTER TABLE COLUMN\G;
```



### Precautions

- A table can only have one Schema Change job running at a time.

- Schema Change operations do not block import and query operations.

- Partition columns and bucket columns cannot be modified.

- If there is a value column aggregated in REPLACE mode in the Schema, it is not allowed to delete the Key column.

  If the Key column is deleted, Doris cannot determine the value of the REPLACE column.

  All non-Key columns of the Unique data model table are REPLACE aggregated.

- When adding a value column whose aggregation type is SUM or REPLACE, the default value of this column has no meaning for historical data.

  Because historical data has lost detailed information, the value of the default value does not actually reflect the aggregated value.

- When modifying the column type, fields other than Type need to be completed according to the information on the original column.

  If you change the column `k1 INT SUM NULL DEFAULT "1"`type to BIGINT, you need to execute the following command:

  `ALTER TABLE tbl1 MODIFY COLUMN `k1` BIGINT SUM NULL DEFAULT "1";`

  Note that in addition to the new column type, such as aggregation method, Nullable attribute, and default value must be completed according to the original information.

- Modifying column names, aggregation types, Nullable properties, default values, and column annotations is not supported.

### Frequently Asked Questions

- Execution Speed of Schema Change

  Currently, the execution speed of Schema Change is estimated to be about 10MB/s according to the worst efficiency. To be conservative, users can set the timeout period of the job according to this rate.

- submit homework error`Table xxx is not stable. ...`

  Schema Change can only start when the table data is complete and unbalanced. Commits are rejected if some shard copies of the table are incomplete, or if some copies are in the middle of a balancing operation.

  You can check whether the data shard copy is complete by running the following command:

  `ADMIN SHOW REPLICA STATUS FROM tbl WHERE STATUS != "OK";`

  If there is a return result, it means that there is a problem with the copy. Usually the system will automatically repair these problems, and users can also use the following command to repair this table first:

  `ADMIN REPAIR TABLE tbl1;`

  Users can use the following command to check whether there is a running balancing task:

  `SHOW PROC "/cluster_balance/pending_tablets";`

  You can wait for the balance task to complete, or temporarily disable the balance operation with the following command:

  `ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");`

## Atomic replacement of two tables

SelectDB supports atomic replacement of two tables. This operation applies only to OLAP tables.

### Grammar Description

```text
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

Replace table tbl1 with table tbl2.

If the `swap`parameter is `true`, after replacement, the data in the `tbl1`table the data in the original `tbl2`table. And the data in the `tbl2`table the data in the original `tbl1`table. That is, the data in the two tables has been swapped.

If the `swap`parameter is `false`, after replacement, the data in the `tbl1`table the data in the original `tbl2`table. And the `tbl2`table named is dropped.

### Principle

The function of replacing the table actually turns the following set of operations into an atomic operation.

Suppose you want to replace table A with table B, and `swap`is `true`, the operation is as follows:

1. Rename Table B to Table A.
2. Rename table A to table B.

If `swap`yes `false`, proceed as follows:

1. Delete table A.
2. Rename Table B to Table A.

### Precautions

1. `swap`The parameter defaults to `true`. That is, the table replacement operation is equivalent to exchanging the data of two tables.
2. If the `swap`parameter is set to `false`, the replaced table (table A) will be deleted and cannot be recovered.
3. The replacement operation can only occur between two OLAP tables, and will not check whether the table structures of the two tables are consistent.
4. The replacement operation will not change the original permission settings. Because the permission check is based on the table name.

### Best practice

Atomic overwrite operation

In some cases, users want to be able to rewrite the data of a certain table, but if the method is deleted first and then imported, the data will not be viewable for a period of time in the middle. At this time, the user can first use the `CREATE TABLE LIKE`statement to create a new table with the same structure, and after importing the new data into the new table, replace the old table atomically through the replacement operation to achieve the goal.

## Data deletion and recovery

In order to avoid disasters caused by misoperation, SelectDB supports data recovery for accidentally deleted databases/tables/partitions. After drop table or drop database, SelectDB will not physically delete the data immediately, but keep it in Trash for a period of time ( The default is 1 day, which can be configured through the catalog_trash_expire_second parameter), and the administrator can recover the accidentally deleted data through the RECOVER command.

### Data recovery

1. Restore the database named test

```sql
RECOVER DATABASE test;
```



2. Restore the table named example_tbl

```sql
RECOVER TABLE test.example_tbl;
```



3. Restore the partition named p1 in the table example_tbl

```sql
RECOVER PARTITION p1 FROM example_tbl;
```



### More help

For more detailed syntax and best practices used by RECOVER, refer to the Recover statement in the SQL manual.

## Cache control

Coming Soon...