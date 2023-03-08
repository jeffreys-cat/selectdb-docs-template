# Table Engine

## Concepts

In SelectDB Cloud, data is logically described in the form of tables. A table includes rows and columns. Row is a row of user data, and Column is used to describe different fields in a row of data.

Column can be divided into two categories: Key and Value. From a business perspective, Key and Value can correspond to dimension columns and indicator columns, respectively.

SelectDB Cloud has three table engines:

- Aggregate
- Unique
- Duplicate

## Aggregate table 

We use practical examples to illustrate what an aggregation table is and how to use it correctly.

### Example 1: Import Data 

Suppose the business has the following data table schema:

| ColumnName      | Type        | AggregationType | Comment                 |
| --------------- | ----------- | --------------- | ----------------------- |
| user_id         | LARGEINT    |                 | user id                 |
| date            | DATE        |                 | data import date        |
| city            | VARCHAR(20) |                 | user's city             |
| age             | SMALLINT    |                 | user age                |
| sex             | TINYINT     |                 | user gender             |
| last_visit_date | DATETIME    | REPLACE         | user last visit time    |
| cost            | BIGINT      | SUM             | total user consumption  |
| max_dwell_time  | INT         | MAX             | user maximum dwell time |
| min_dwell_time  | INT         | MIN             | user minimum dwell time |

If it is converted into a table creation statement, it is as follows (omitting the Partition and Distribution information in the table creation statement)

```sql
CREATE TABLE IF NOT EXISTS test.example_tbl
(
    `user_id` LARGEINT NOT NULL, 
    `date` DATE NOT NULL,
    `city` VARCHAR(20), 
    `age` SMALLINT,
    `sex` TINYINT,
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00",
    `cost` BIGINT SUM DEFAULT "0",
    `max_dwell_time` INT MAX DEFAULT "0",
    `min_dwell_time` INT MIN DEFAULT "99999"
)
AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1;
```

As you can see, this is a typical fact table of user information and access behavior. In a general star schema, user information and access behavior are generally stored in dimension tables and fact tables, respectively. Here we store the two parts of information in one table in order to explain the data model of SelectDB more conveniently.

`AggregationType`The columns in the table are divided into Key (dimension column) and Value (index column) according to whether they are set . Those `AggregationType`that are , such as `user_id`, `date`, `age`..., etc. are called **Key** , and those that are set `AggregationType`are called **Value** .

When we import data, the rows with the same Key column will be aggregated into one row, and the Value column will `AggregationType`be . `AggregationType`Currently there are the following aggregation methods:

- SUM: summation. Applies to numeric types.
- MIN: Find the minimum value. Suitable for numeric types.
- MAX: Find the maximum value. Suitable for numeric types.
- REPLACE: Replace. For rows with the same dimension column, the indicator columns will be imported in the order in which they are imported, and the one imported later will replace the one imported earlier.
- REPLACE_IF_NOT_NULL: Replace with non-null values. The difference with REPLACE is that no replacement is performed for null values. It should be noted here that the default value of the field should be NULL instead of an empty string. If it is an empty string, it will be replaced with an empty string for you.
- HLL_UNION: Aggregation method of columns of HLL type, aggregated by HyperLogLog algorithm.
- BITMAP_UNION: Aggregation method for columns of BIMTAP type, performing union aggregation of bitmaps.

Suppose we have the following import data (**raw data**):

| user_id | date       | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

Then when this batch of data is correctly imported into SelectDB, the **final storage** in SelectDB is as follows:

| user_id | date       | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 35   | 10             | 2              |
| 10001   | 2017-10-01 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

**It can be seen that there is only one row of aggregated** data left for user 10000 . The data of other users is consistent with the original data. Here is an explanation of the aggregated data of user 10000:

The first 5 columns are unchanged, `last_visit_date`starting :

- `2017-10-01 07:00:00`: Because the aggregation method of the `last_visit_date`column is REPLACE, the `2017-10-01 07:00:00`replaced `2017-10-01 06:00:00`is saved .

  > Note: For the data in the same import batch, for the aggregation method of REPLACE, the replacement order is not guaranteed. As in this example, what was eventually saved may also be `2017-10-01 06:00:00`. As for the data in different imported batches, it can be guaranteed that the data in the later batch will replace the previous batch.

- `35`: Because the aggregation type of the `cost`column is SUM, 35 is obtained by adding up 20 + 15.

- `10`: Since the aggregation type of the `max_dwell_time`column is MAX, 10 and 2 take the maximum value to get 10.

- `2`: Because the aggregation type of the `min_dwell_time`column is MIN, 10 and 2 take the minimum value, and 2 is obtained.

After aggregation, only the aggregated data will be stored in SelectDB. In other words, the detailed data will be lost, and users can no longer query the detailed data before aggregation.

### Example 2: Keep detailed data

Following Example 1, we modify the table structure as follows:

| ColumnName      | Type        | AggregationType | Comment                              |
| --------------- | ----------- | --------------- | ------------------------------------ |
| user_id         | LARGEINT    |                 | user id                              |
| date            | DATE        |                 | data import date                     |
| timestamp       | DATETIME    |                 | Data import time, accurate to second |
| city            | VARCHAR(20) |                 | user's city                          |
| age             | SMALLINT    |                 | user age                             |
| sex             | TINYINT     |                 | user gender                          |
| last_visit_date | DATETIME    | REPLACE         | user last visit time                 |
| cost            | BIGINT      | SUM             | total user consumption               |
| max_dwell_time  | INT         | MAX             | user maximum dwell time              |
| min_dwell_time  | INT         | MIN             | user minimum dwell time              |

That is, a column  `timestamp` is added to record the data import time. At the same time, `AGGREGATE KEY` is set as (user_id, date, timestamp, city, age, sex)`

The imported **raw data** is as follows:

| user_id | date       | timestamp           | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | ------------------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | 2017-10-01 08:00:05 | Beijing   | 20   | 0    | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | 2017-10-01 09:00:05 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | 2017-10-01 18:12:10 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | 2017-10-02 13:10:00 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | 2017-10-02 13:15:00 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | 2017-10-01 12:12:48 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | 2017-10-03 12:38:20 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

Then when this batch of data is correctly imported into SelectDB, the final storage in SelectDB is as follows:

| user_id | date       | timestamp           | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | ------------------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | 2017-10-01 08:00:05 | Beijing   | 20   | 0    | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | 2017-10-01 09:00:05 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | 2017-10-01 18:12:10 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | 2017-10-02 13:10:00 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | 2017-10-02 13:15:00 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | 2017-10-01 12:12:48 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | 2017-10-03 12:38:20 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

It can be seen that the stored data is exactly the same as the imported data without any aggregation. This is because, in this batch of data `timestamp`, the Keys of all rows are **not exactly** the same due to the addition of columns . That is to say, as long as the key of each row in the imported data is not exactly the same, the complete detailed data can be saved even under the aggregation model.

### Example 3: Import data and aggregate

Follow example 1. Suppose the existing data in the table is as follows:

| user_id | date       | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 35   | 10             | 2              |
| 10001   | 2017-10-01 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

Let's import a new batch of data:

| user_id | date       | city     | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | -------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10004   | 2017-10-03 | Shenzhen | 35   | 0    | 2017-10-03 11:22:00 | 44   | 19             | 19             |
| 10005   | 2017-10-03 | Changsha | 29   | 1    | 2017-10-03 18:11:02 | 3    | 1              | 1              |

Then when this batch of data is correctly imported into SelectDB, the final storage in SelectDB is as follows:

| user_id | date       | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 35   | 10             | 2              |
| 10001   | 2017-10-01 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35   | 0    | 2017-10-03 11:22:00 | 55   | 19             | 6              |
| 10005   | 2017-10-03 | Changsha  | 29   | 1    | 2017-10-03 18:11:02 | 3    | 1              | 1              |

It can be seen that the existing data of user 10004 and the newly imported data are aggregated. At the same time, the data of 10005 users has been added.

The aggregation of data occurs in the following three stages in SelectDB:

1. ETL stage for each batch of data import. This stage aggregates within each batch of imported data.
2. The stage where the computing cluster performs data compaction. At this stage, the computing cluster will further aggregate the imported data of different batches.
3. Data query stage. During data query, corresponding aggregation will be performed for the data involved in the query.

The data may be aggregated at different times at different times. For example, when a batch of data is just imported, it may not be aggregated with the previously existing data. But for users, users **can only query** aggregated data. That is, different degrees of aggregation are transparent to user queries. Users should always assume that the data exists in a **final and complete form of aggregation** , and **should not assume that some aggregation has not yet occurred** .

## Unique table 

In some multidimensional analysis scenarios, users pay more attention to how to ensure the uniqueness of the Key, that is, how to obtain the uniqueness constraint of the Primary Key. Therefore, we introduced the Unique table engine. In the current version, this model is essentially a special case of the aggregation model and a simplified representation of the table structure. Since the implementation of the aggregation model is merge on read, the performance of some aggregation queries is not good. In the next hungry version, SelectDB introduces a new implementation of the Unique model, merge on write, through Do some extra work on writes to achieve optimal query performance. Merge-on-write will replace merge-on-read as the default implementation of the Unique model in the future, and the two will coexist for a short period of time. The following will illustrate the two implementation manners with examples respectively.

### Merge on read (same implementation as aggregate table) 

| ColumnName    | Type         | IsKey | Comment                |
| ------------- | ------------ | ----- | ---------------------- |
| user_id       | BIGINT       | Yes   | user id                |
| username      | VARCHAR(50)  | Yes   | user name              |
| city          | VARCHAR(20)  | No    | user's city            |
| age           | SMALLINT     | No    | user age               |
| sex           | TINYINT      | No    | user gender            |
| phone         | LARGEINT     | No    | user phone             |
| address       | VARCHAR(500) | No    | user address           |
| register_time | DATETIME     | No    | user registration time |

This is a typical user basic information table. This type of data has no aggregation requirements, and only needs to ensure the uniqueness of the primary key. (here the primary key is user_id + username). Then the table creation statement is as follows:

```sql
CREATE TABLE IF NOT EXISTS test.example_tbl
(
    `user_id` LARGEINT NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `phone` LARGEINT,
    `address` VARCHAR(500),
    `register_time` DATETIME
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1;
```

And this table structure is exactly equivalent to the following table structure described using the aggregation table engine:

| ColumnName    | Type         | AggregationType | Comment                |
| ------------- | ------------ | --------------- | ---------------------- |
| user_id       | BIGINT       |                 | user id                |
| username      | VARCHAR(50)  |                 | user name              |
| city          | VARCHAR(20)  | REPLACE         | user's city            |
| age           | SMALLINT     | REPLACE         | user age               |
| sex           | TINYINT      | REPLACE         | user gender            |
| phone         | LARGEINT     | REPLACE         | user phone             |
| address       | VARCHAR(500) | REPLACE         | user address           |
| register_time | DATETIME     | REPLACE         | user registration time |

And create a table as:

```sql
CREATE TABLE IF NOT EXISTS test.example_tbl
(
    `user_id` LARGEINT NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `city` VARCHAR(20) REPLACE,
    `age` SMALLINT REPLACE,
    `sex` TINYINT REPLACE,
    `phone` LARGEINT REPLACE,
    `address` VARCHAR(500) REPLACE,
    `register_time` DATETIME REPLACE
)
AGGREGATE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1;
```

That is, the unique engine's read-time merge implementation can be completely replaced by the REPLACE method in the aggregation model. Its internal implementation and data storage are exactly the same. No further examples are given here.

### Merge on write (coming soon)

The merge-on-write implementation of the Unqiue table engine is completely different from the aggregation table engine. The query performance is closer to the duplicate model. Compared with the aggregation model, it has a greater query performance advantage in scenarios with primary key constraints. Especially in aggregate queries and queries that require filtering large amounts of data with indexes.

In the upcoming version, as a new feature, merge-on-write is disabled by default, and users can enable it by adding the following property

```text
“enable_unique_key_merge_on_write” = “true”
```

Still taking the above table as an example, the table creation statement is:

```sql
CREATE TABLE IF NOT EXISTS test.example_tbl
(
    `user_id` LARGEINT NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `phone` LARGEINT,
    `address` VARCHAR(500),
    `register_time` DATETIME
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"enable_unique_key_merge_on_write" = "true"
);
```

The table structure created by using this table creation statement is completely different from the aggregation table engine:

| ColumnName    | Type         | AggregationType | Comment                |
| ------------- | ------------ | --------------- | ---------------------- |
| user_id       | BIGINT       |                 | user id                |
| username      | VARCHAR(50)  |                 | user name              |
| city          | VARCHAR(20)  | NONE            | user's city            |
| age           | SMALLINT     | NONE            | user age               |
| sex           | TINYINT      | NONE            | user gender            |
| phone         | LARGEINT     | NONE            | user phone             |
| address       | VARCHAR(500) | NONE            | user address           |
| register_time | DATETIME     | NONE            | user registration time |

On the Unique table with the merge-on-write option enabled, the overwritten and updated data will be marked and deleted during the data import phase, and new data will be written to a new file at the same time. When querying, all data marked for deletion will be filtered out at the file level, and the read data will be the latest data, which eliminates the data aggregation process in the read-time merge, and can support in many cases Pushdown of various predicates. Therefore, it can bring relatively large performance improvements in many scenarios, especially in the case of aggregation queries.

【Notice】

1. The new Merge-on-write implementation is turned off by default and can only be turned on by specifying a property when creating a table.
2. The old Merge-on-read implementation cannot be seamlessly upgraded to the new version (the data organization method is completely different). If you need to use the merge-on-write implementation version, you need to perform it manually `insert into unique-mow-table select * from source table`.
3. The unique delete sign and sequence col on the Unique engine can still be used normally in the new version of the merge-on-write implementation, and the usage has not changed.

## Duplicate table 

In some multidimensional analysis scenarios, the data has neither a primary key nor aggregation requirements. Therefore, the Duplicate data model is introduced to meet such needs. for example:

| ColumnName | Type          | SortKey | Comment         |
| ---------- | ------------- | ------- | --------------- |
| timestamp  | DATETIME      | Yes     | log time        |
| type       | INT           | Yes     | log type        |
| error_code | INT           | Yes     | error code      |
| error_msg  | VARCHAR(1024) | No      | error details   |
| op_id      | BIGINT        | No      | person id       |
| at_time    | DATETIME      | No      | processing time |

The table creation statement is as follows:

```sql
CREATE TABLE IF NOT EXISTS test.example_tbl
(
    `timestamp` DATETIME NOT NULL ,
    `type` INT NOT NULL,
    `error_code` INT,
    `error_msg` VARCHAR(1024),
    `op_id` BIGINT,
    `op_time` DATETIME
)
DUPLICATE KEY(`timestamp`, `type`, `error_code`)
DISTRIBUTED BY HASH(`type`) BUCKETS 1;
```

This table model is distinguished from the Aggregate and Unique models. The data is stored exactly as it is in the imported file without any aggregation. Even if two rows of data are identical, they will be preserved. The DUPLICATE KEY specified in the table creation statement is only used to indicate that the underlying data is sorted by those columns. In the selection of DUPLICATE KEY, it is recommended to select the first 2-4 columns appropriately.

This table model is suitable for storing raw data that has neither aggregation requirements nor primary key uniqueness constraints.

## Limitations of aggregate table

Here we introduce the limitations of the aggregation model for the Aggregate table.

In the aggregation table engine, what the model presents to the outside world is the **final aggregated** data. In other words, any data that has not been aggregated (for example, data from two different import batches) must pass some way to ensure the consistency of external display. Let's illustrate with an example.

Suppose the table structure is as follows:

| ColumnName | Type     | AggregationType | Comment                |
| ---------- | -------- | --------------- | ---------------------- |
| user_id    | LARGEINT |                 | user id                |
| date       | DATE     |                 | data import date       |
| cost       | BIGINT   | SUM             | total user consumption |

Assume that the storage engine has the following two imported batches of data:

**batch 1**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 50   |
| 10002   | 2017-11-21 | 39   |

**batch 2**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 1    |
| 10001   | 2017-11-21 | 5    |
| 10003   | 2017-11-22 | 22   |

It can be seen that the data of user 10001 belonging to the two import batches has not yet been aggregated. However, in order to ensure that users can only query the following final aggregated data:

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 51   |
| 10001   | 2017-11-21 | 5    |
| 10002   | 2017-11-21 | 39   |
| 10003   | 2017-11-22 | 22   |

We have added an aggregation operator to the query engine to ensure external data consistency.

In addition, on the aggregation column (Value), pay attention to the semantics when performing aggregation queries that are inconsistent with the aggregation type. For example, we execute the following query in the above example:

```text
SELECT MIN(cost) FROM table;
```

The result is 5, not 1.

At the same time, this consistency guarantee will greatly reduce query efficiency in some queries.

Let's take the most basic count(*) query as an example:

```text
SELECT COUNT(*) FROM table;
```

In other databases, such queries will return results very quickly. Because in terms of implementation, we can use methods such as "counting rows when importing and saving count statistics", or "scanning only a certain column of data to obtain the count value" during query, with only a small overhead, that is Query results are available. But in the aggregation table engine, the overhead of this kind of query is **very high** .

Let's take the data just now as an example:

**batch 1**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 50   |
| 10002   | 2017-11-21 | 39   |

**batch 2**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 1    |
| 10001   | 2017-11-21 | 5    |
| 10003   | 2017-11-22 | 22   |

Because the final aggregation result is:

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 51   |
| 10001   | 2017-11-21 | 5    |
| 10002   | 2017-11-21 | 39   |
| 10003   | 2017-11-22 | 22   |

So, `select count(*) from table;`the correct result of , should be **4** . But if we only scan `user_id`this column, if we add query-time aggregation, the final result is **3** (10001, 10002, 10003). And if aggregation is not added during query, the result is **5** (a total of 5 rows of data in two batches). It can be seen that both of these results are incorrect.

In order to get the correct result, we must `user_id`read `date`the data of the two columns of and at the same time, and **add the aggregation during the query** to return the correct result of **4 .** That is to say, in the count( *) query, all AGGREGATE KEY columns (here is `user_id`and `date`) must be scanned and aggregated to obtain semantically correct results. When there are many aggregated columns, the count(* ) query needs to scan a large amount of data.

Therefore, when there are frequent count(*) queries in the business, we recommend that users **simulate count( \* )** by adding a column whose value is always 1 and whose aggregation type is SUM . For example, the table structure in the example just now is modified as follows:

| ColumnName | Type   | AggregateType | Comment                 |
| ---------- | ------ | ------------- | ----------------------- |
| user_id    | BIGINT |               | user id                 |
| date       | DATE   |               | data import date        |
| cost       | BIGINT | SUM           | total user consumption  |
| count      | BIGINT | SUM           | used to calculate count |

Add a count column, and the value of this column is **always 1** in the imported data . Then `select count(*) from table;`the result of is equivalent to `select sum(count) from table;`. The query efficiency of the latter will be much higher than that of the former. However, this method also has limitations, that is, users need to ensure that they will not repeatedly import rows with the same AGGREGATE KEY columns. Otherwise, `select sum(count) from table;`only the original imported line number can be expressed, not `select count(*) from table;`the semantics of the .

Another way is **to change `count`the aggregation type of the above column to REPLACE, and the value is still 1** . `select sum(count) from table;`Then `select count(*) from table;`the results of and will be the same. And this way, there is no limitation of importing duplicate rows.

### Merge-on-write implementation

The merge-on-write implementation of the Unique engine does not have the limitations of the aggregation engine. Taking the data just now as an example, merge-on-write adds a corresponding delete bitmap to each imported rowset to mark which data is overwritten. The status after the first batch of data import is as follows

**batch 1**

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017-11-20 | 50   | false      |
| 10002   | 2017-11-21 | 39   | false      |

When the second batch of data is imported, the duplicated rows in the first batch of data will be marked as deleted. At this time, the status of the two batches of data is as follows

**batch 1**

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017-11-20 | 50   | **true**   |
| 10002   | 2017-11-21 | 39   | false      |

**batch 2**

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017-11-20 | 1    | false      |
| 10001   | 2017-11-21 | 5    | false      |
| 10003   | 2017-11-22 | 22   | false      |

When querying, all the data marked for deletion in the delete bitmap will not be read out, so there is no need to do any data aggregation. The effective number of rows in the above data is 4 rows, and the query result should also be 4 rows. In other words, the result can be obtained with the least overhead, that is, the aforementioned method of "scanning only a certain column of data to obtain the count value".

In the test environment, the performance of the count(*) query on the write-time merge implementation of the Unique engine is more than 10 times higher than that of the aggregation model.

### Duplicate table

Duplicate models do not have this limitation of the aggregation engine. Because the engine does not involve aggregation semantics, when doing count(*) query, you can get a result with correct semantics by selecting a column of query arbitrarily.

## Key column

Duplicate, Aggregate, and Unique engines all specify the key column when creating a table, but there are differences in practice: for the Duplicate engine, the key column of the table can be considered as a "sorting column" rather than a unique identifier. For aggregate tables such as Aggregate and Unique engines, the key column takes into account both the "sorting column" and the "unique identification column", and is a "key column" in the true sense.

## Table engine selection

Because the storage engine of the table is determined when the table is created and **cannot be modified** . Therefore, it is very important to choose an appropriate table engine.

1. The Aggregate engine can greatly reduce the amount of data scanned and the amount of calculation required for aggregation queries through pre-aggregation, which is very suitable for report query scenarios with fixed patterns. But the model is not friendly to count(*) queries. At the same time, because the aggregation method on the Value column is fixed, semantic correctness needs to be considered when performing other types of aggregation queries.
2. The Unique engine can guarantee the uniqueness of the primary key for scenarios that require a unique primary key constraint. However, it cannot take advantage of the query advantages brought by pre-aggregation such as ROLLUP.
   1. For users with high performance requirements for aggregation queries, it is recommended to use the merge-on-write implementation added since version 1.2.
   2. The Unique engine only supports the update of the entire row. If the user needs both the unique primary key constraint and the update of some columns (for example, the situation of importing multiple source tables into one table), you can consider using the Aggregate model, and at the same time set the aggregation type of the non-primary key column to Set to REPLACE_IF_NOT_NULL. For specific usage, please refer to the **SQL manual** .
3. Duplicate is suitable for Ad-hoc queries of any dimension. Although the feature of pre-aggregation cannot be used, it is not constrained by the aggregation model and can take advantage of the column storage model (only read relevant columns instead of all Key columns).
