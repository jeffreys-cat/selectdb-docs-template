# Rollup and Materialized View

## Rollup

Rollup means "roll up" in multidimensional analysis, that is, to further aggregate data at a specified granularity.

In SelectDB, we call the table created by the user through the table creation statement Base Table (Base Table). The Base table stores the basic data stored in the manner specified by the user's table creation statement.

On top of the Base table, we can create any number of Rollup tables. These Rollup data are generated based on the Base table and are physically **stored independently** .

The basic role of the Rollup table is to obtain coarser-grained aggregated data on the basis of the Base table.

Below we use examples to detail the Rollup table and its role in different data models.

### Rollup in Aggregate and Unique tables

Since Unique is just a special case of the Aggregate model, we do not make a distinction here.

**Example 1: Get the total consumption of each user**

The Base table structure is as follows:

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

The stored data is as follows:

| user_id | date       | timestamp           | city      | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | ------------------- | --------- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | 2017-10-01 08:00:05 | Beijing   | 20   | 0    | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | 2017-10-01 09:00:05 | Beijing   | 20   | 0    | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | 2017-10-01 18:12:10 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | 2017-10-02 13:10:00 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | 2017-10-02 13:15:00 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | 2017-10-01 12:12:48 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | 2017-10-03 12:38:20 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

Based on this, we create a Rollup:

| ColumnName |
| ---------- |
| user_id    |
| cost       |

This Rollup contains only two columns: user_id and cost. After the creation is complete, the data stored in the Rollup is as follows:

| user_id | cost |
| ------- | ---- |
| 10000   | 35   |
| 10001   | 2    |
| 10002   | 200  |
| 10003   | 30   |
| 10004   | 111  |

It can be seen that only the result of SUM on the cost column for each user_id is kept in Rollup. Then when we perform the following query:

```sql
SELECT user_id, sum(cost) FROM table GROUP BY user_id;
```

It will automatically hit the Rollup table, so that this aggregation query can be completed only by scanning a very small amount of data.

**Example 2: Obtain the total consumption, longest and shortest page dwell time of users of different age groups in different cities**

Next to the Base table in Example 1, create a Rollup:

| ColumnName     | Type        | AggregationType | Comment                 |
| -------------- | ----------- | --------------- | ----------------------- |
| city           | VARCHAR(20) |                 | user's city             |
| age            | SMALLINT    |                 | user age                |
| cost           | BIGINT      | SUM             | total user consumption  |
| max_dwell_time | INT         | MAX             | user maximum dwell time |
| min_dwell_time | INT         | MIN             | user minimum dwell time |

After the creation is complete, the data stored in the Rollup is as follows:

| city      | age  | cost | max_dwell_time | min_dwell_time |
| --------- | ---- | ---- | -------------- | -------------- |
| Beijing   | 20   | 35   | 10             | 2              |
| Beijing   | 30   | 2    | 22             | 22             |
| Shanghai  | 20   | 200  | 5              | 5              |
| Guangzhou | 32   | 30   | 11             | 11             |
| Shenzhen  | 35   | 111  | 6              | 3              |

When we make queries like these:

```sql
mysql> SELECT city, age, sum(cost), max(max_dwell_time), min(min_dwell_time) FROM table GROUP BY city, age;
mysql> SELECT city, sum(cost), max(max_dwell_time), min(min_dwell_time) FROM table GROUP BY city;
mysql> SELECT city, age, sum(cost), min(min_dwell_time) FROM table GROUP BY city, age;
```

Will automatically hit the Rollup table.

### Rollup in the Duplicate model

Because the Duplicate model has no aggregation semantics. Therefore, Rollup in this model has lost the meaning of "rolling up". It is only used to adjust the column order to hit the prefix index.

**Rollup adjusts the prefix index**

Because the column order has been specified when the table is created, there is only one prefix index for a table. For queries that use other columns that cannot hit the prefix index as conditions, the efficiency may not meet the requirements. Therefore, we can artificially adjust the column order by creating Rollup. for example:

The Base table structure is as follows:

| ColumnName     | Type         |
| -------------- | ------------ |
| user_id        | BIGINT       |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

We can create a Rollup table on top of this:

| ColumnName     | Type         |
| -------------- | ------------ |
| age            | INT          |
| user_id        | BIGINT       |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

It can be seen that the columns of Rollup and Base table are exactly the same, but the order of user_id and age is changed. Then when we perform the following query:

```sql
mysql> SELECT * FROM table where age=20 and message LIKE "%error%";
```

The Rollup table will be preferred because the prefix index of Rollup has a higher matching degree.

### Rollup Instructions

- The most fundamental role of Rollup is to improve the query efficiency of some queries (whether it is to reduce the amount of data through aggregation, or to modify the column order to match the prefix index). Therefore, the meaning of Rollup has gone beyond the scope of "rolling up".
- Rollup is attached to the Base table and can be regarded as an auxiliary data structure of the Base table. Users can create or delete Rollups based on the Base table, but cannot explicitly specify a Rollup in the query. Whether to hit Rollup is completely determined automatically by the system.
- The data of Rollup is physically stored independently. Therefore, the more Rollups that are created, the more disk space is consumed. At the same time, it will also affect the import speed (the ETL stage of import will automatically generate all Rollup data), but it will not reduce the query efficiency (only better).
- The data update of Rollup is fully synchronized with the Base table. Users do not need to care about this issue.
- The aggregation method of columns in Rollup is exactly the same as that of the Base table. There is no need to specify and cannot be modified when creating a Rollup.
- A necessary condition (not a sufficient condition) for whether a query can hit a Rollup is that **all columns** involved in the query (including query condition columns in the select list and where, etc.) exist in the columns of the Rollup. Otherwise, the query can only hit the Base table.
- Some types of queries (such as count(*)) cannot hit Rollup under any conditions.
- The query execution plan can be obtained through the `EXPLAIN your_sql;`command , and in the execution plan, check whether Rollup is hit.
- You can use the `DESC tbl_name ALL;`statement display the Base table and all created Rollups.

### Query

In SelectDB, Rollup acts as a polymerized view, which can play two roles in queries:

- index
- Aggregate data (only for aggregate model, ie aggregate key)

However, certain conditions must be met in order to hit the Rollup, and you can judge whether the Rollup can be hit by the value of the PreAggregation of the ScanNode node in the execution plan, and which Rollup table is hit by the Rollup field.

#### Index

The prefix index of SelectDB has been introduced in the previous index, that is, the first 36 bytes in the Base/Rollup table (with varchar type may cause the prefix index to be less than 36 bytes, varchar will truncate the prefix index, and use at most 20 bytes of varchar) generate a separate sorted sparse index data in the underlying storage engine (the data is also sorted, use the index to locate, and then do a binary search in the data), and then query according to the conditions in the query to match the prefix index of each Base/Rollup, and select a Base/Rollup with the longest matching prefix index.

```text
       -----> match from left to right
+----+----+----+----+----+----+
| c1 | c2 | c3 | c4 | c5 |... |
```



As shown in the figure above, take where and on in the query and push them up and down to the ScanNode condition, start matching from the first column of the prefix index, check whether there are these columns in the condition, and accumulate the length of the match until the match fails or ends at 36 bytes (The column of varchar type can only match 20 bytes, and will match less than 36 bytes to truncate the prefix index), and then select a Base/Rollup with the longest matching length. The following example shows that a Base table is created and Four Rollups:

```text
+---------------+-------+--------------+------+-------+---------+-------+
| IndexName     | Field | Type         | Null | Key   | Default | Extra |
+---------------+-------+--------------+------+-------+---------+-------+
| test          | k1    | TINYINT      | Yes  | true  | N/A     |       |
|               | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|               | k3    | INT          | Yes  | true  | N/A     |       |
|               | k4    | BIGINT       | Yes  | true  | N/A     |       |
|               | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|               | k6    | CHAR(5)      | Yes  | true  | N/A     |       |
|               | k7    | DATE         | Yes  | true  | N/A     |       |
|               | k8    | DATETIME     | Yes  | true  | N/A     |       |
|               | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
|               | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|               | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|               |       |              |      |       |         |       |
| Rollup_index1 | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
|               | k1    | TINYINT      | Yes  | true  | N/A     |       |
|               | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|               | k3    | INT          | Yes  | true  | N/A     |       |
|               | k4    | BIGINT       | Yes  | true  | N/A     |       |
|               | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|               | k6    | CHAR(5)      | Yes  | true  | N/A     |       |
|               | k7    | DATE         | Yes  | true  | N/A     |       |
|               | k8    | DATETIME     | Yes  | true  | N/A     |       |
|               | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|               | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|               |       |              |      |       |         |       |
| Rollup_index2 | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
|               | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|               | k1    | TINYINT      | Yes  | true  | N/A     |       |
|               | k3    | INT          | Yes  | true  | N/A     |       |
|               | k4    | BIGINT       | Yes  | true  | N/A     |       |
|               | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|               | k6    | CHAR(5)      | Yes  | true  | N/A     |       |
|               | k7    | DATE         | Yes  | true  | N/A     |       |
|               | k8    | DATETIME     | Yes  | true  | N/A     |       |
|               | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|               | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|               |       |              |      |       |         |       |
| Rollup_index3 | k4    | BIGINT       | Yes  | true  | N/A     |       |
|               | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|               | k6    | CHAR(5)      | Yes  | true  | N/A     |       |
|               | k1    | TINYINT      | Yes  | true  | N/A     |       |
|               | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|               | k3    | INT          | Yes  | true  | N/A     |       |
|               | k7    | DATE         | Yes  | true  | N/A     |       |
|               | k8    | DATETIME     | Yes  | true  | N/A     |       |
|               | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
|               | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|               | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|               |       |              |      |       |         |       |
| Rollup_index4 | k4    | BIGINT       | Yes  | true  | N/A     |       |
|               | k6    | CHAR(5)      | Yes  | true  | N/A     |       |
|               | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|               | k1    | TINYINT      | Yes  | true  | N/A     |       |
|               | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|               | k3    | INT          | Yes  | true  | N/A     |       |
|               | k7    | DATE         | Yes  | true  | N/A     |       |
|               | k8    | DATETIME     | Yes  | true  | N/A     |       |
|               | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
|               | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|               | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
+---------------+-------+--------------+------+-------+---------+-------+
```



The prefix indexes of these five tables are

```text
Base(k1 ,k2, k3, k4, k5, k6, k7)

Rollup_index1(k9)

Rollup_index2(k9)

Rollup_index3(k4, k5, k6, k1, k2, k3, k7)

Rollup_index4(k4, k6, k5, k1, k2, k3, k7)
```



The conditions on the columns of the prefix index that can be used need to be `=` `<` `>` `<=` `>=` `in` `between`these and these conditions are parallel and the relationship uses `and`connection. For `or`, `!=`etc., these cannot be hit, and then look at the following query:

```sql
SELECT * FROM test WHERE k1 = 1 AND k2 > 3;
```



There are conditions on k1 and k2, check that only the first column of Base contains k1 in the condition, so match the longest prefix index, which is the base table of test.

Look again at the following query:

```sql
SELECT * FROM test WHERE k4 = 1 AND k5 > 3;
```



There are k4 and k5 conditions, check Rollup_index3, the first column of Rollup_index4 contains k4, but the second column of Rollup_index3 contains k5, so the matching prefix index is the longest.

Now we try to match conditions on columns containing varchar, as follows:

```sql
SELECT * FROM test WHERE k9 IN ("xxx", "yyyy") AND k1 = 10;
```



There are two conditions of k9 and k1. The first column of Rollup_index1 and Rollup_index2 both contain k9. It stands to reason that choosing these two Rollups here can hit the prefix index and the effect is the same. Just randomly select one (because here varchar is exactly 20 characters section, the prefix index is truncated if it is less than 36 bytes), but the current strategy will continue to match k1 here, because the second column of Rollup_index1 is k1, so Rollup_index1 is selected. In fact, the following k1 condition will not play a role in accelerating . (If conditions other than the prefix index require it to speed up the query, you can speed it up by creating a BloomFilter filter. Generally, it is enough to create a string type, because SelectDB has a Block level for columns and has a Min for integers and dates. /Max index) The following are the results of explain.

```text
  0:OlapScanNode                                                                                                                                                                                                                                                                                                                                                                                                  
|      TABLE: test                                                                                                                                                                                                                                                                                                                                                                                                  
|      PREAGGREGATION: OFF. Reason: No AggregateInfo                                                                                                                                                                                                                                                                                                                                                                
|      PREDICATES: `k9` IN ('xxx', 'yyyy'), `k1` = 10                                                                                                                                                                                                                                                                                                                                                               
|      partitions=1/1                                                                                                                                                                                                                                                                                                                                                                                               
|      Rollup: Rollup_index1                                                                                                                                                                                                                                                                                                                                                                                        
|      buckets=1/10                                                                                                                                                                                                                                                                                                                                                                                                 
|      cardinality=-1                                                                                                                                                                                                                                                                                                                                                                                               
|      avgRowSize=0.0                                                                                                                                                                                                                                                                                                                                                                                               
|      numNodes=0                                                                                                                                                                                                                                                                                                                                                                                                   
|      tuple ids: 0
```



Finally, look at a query that can be hit by multiple Rollups:

```sql
SELECT * FROM test WHERE k4 < 1000 AND k5 = 80 AND k6 >= 10000;
```



There are three conditions of k4, k5, and k6. The first three columns of Rollup_index3 and Rollup_index4 contain these three columns respectively, so the length of the prefix index matched by the two is the same. You can choose both. The current default strategy is to select the one created earlier. A Rollup, here is Rollup_index3.

```text
|   0:OlapScanNode                                                                                                                                                                                                                                                                                                                                                                                                  
|      TABLE: test                                                                                                                                                                                                                                                                                                                                                                                                  
|      PREAGGREGATION: OFF. Reason: No AggregateInfo                                                                                                                                                                                                                                                                                                                                                                
|      PREDICATES: `k4` < 1000, `k5` = 80, `k6` >= 10000.0                                                                                                                                                                                                                                                                                                                                                          
|      partitions=1/1                                                                                                                                                                                                                                                                                                                                                                                               
|      Rollup: Rollup_index3                                                                                                                                                                                                                                                                                                                                                                                        
|      buckets=10/10                                                                                                                                                                                                                                                                                                                                                                                                
|      cardinality=-1                                                                                                                                                                                                                                                                                                                                                                                               
|      avgRowSize=0.0                                                                                                                                                                                                                                                                                                                                                                                               
|      numNodes=0                                                                                                                                                                                                                                                                                                                                                                                                   
|      tuple ids: 0
```



If you modify the above query slightly to:

```text
SELECT * FROM test WHERE k4 < 1000 AND k5 = 80 OR k6 >= 10000;
```



Then the query here cannot hit the prefix index. (Not even any Min/Max, BloomFilter indexes within the storage engine will work)

#### aggregated data

Of course, the function of aggregating data in general polymerized views is essential. This type of materialized view is very helpful for aggregation queries or report queries. To hit the polymerized view, the following prerequisites are required:

1. All columns involved in a query or subquery are stored in an independent Rollup.
2. If there is a join in the query or subquery, the type of the join needs to be an inner join.

Here are some types of aggregation queries that can hit Rollup,

| Column Type Query Type | Sum   | Distinct/Count Distinct | Min   | Max   | APPROX_COUNT_DISTINCT |
| ---------------------- | ----- | ----------------------- | ----- | ----- | --------------------- |
| Key                    | false | true                    | true  | true  | true                  |
| Value(Sum)             | true  | false                   | false | false | false                 |
| Value(Replace)         | false | false                   | false | false | false                 |
| Value(Min)             | false | false                   | true  | false | false                 |
| Value(Max)             | false | false                   | false | true  | false                 |

If the above conditions are met, there will be two stages when judging hit Rollup for the aggregation model:

1. First, match the Rollup table with the longest prefix index index through conditional matching, see the above index strategy.
2. Then compare the number of Rollup rows and choose the smallest Rollup.

The following Base table and Rollup:

```text
+-------------+-------+--------------+------+-------+---------+-------+
| IndexName   | Field | Type         | Null | Key   | Default | Extra |
+-------------+-------+--------------+------+-------+---------+-------+
| test_Rollup | k1    | TINYINT      | Yes  | true  | N/A     |       |
|             | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|             | k3    | INT          | Yes  | true  | N/A     |       |
|             | k4    | BIGINT       | Yes  | true  | N/A     |       |
|             | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|             | k6    | CHAR(5)      | Yes  | true  | N/A     |       |
|             | k7    | DATE         | Yes  | true  | N/A     |       |
|             | k8    | DATETIME     | Yes  | true  | N/A     |       |
|             | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
|             | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|             | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|             |       |              |      |       |         |       |
| Rollup2     | k1    | TINYINT      | Yes  | true  | N/A     |       |
|             | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|             | k3    | INT          | Yes  | true  | N/A     |       |
|             | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|             | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|             |       |              |      |       |         |       |
| Rollup1     | k1    | TINYINT      | Yes  | true  | N/A     |       |
|             | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|             | k3    | INT          | Yes  | true  | N/A     |       |
|             | k4    | BIGINT       | Yes  | true  | N/A     |       |
|             | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|             | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|             | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
+-------------+-------+--------------+------+-------+---------+-------+
```



Look at the following query:

```sql
SELECT SUM(k11) FROM test_Rollup WHERE k1 = 10 AND k2 > 200 AND k3 in (1,2,3);
```



First judge whether the query can hit the aggregated Rollup table. After checking the above figure, it is possible, and then the conditions contain three conditions of k1, k2, and k3. The first three columns of these three conditions test_Rollup, Rollup1, and Rollup2 are all included, so The length of the prefix index is the same, and then comparing the number of rows, it is obvious that Rollup2 has the highest degree of aggregation and the least number of rows, so Rollup2 is selected.

```text
|   0:OlapScanNode                                          |
|      TABLE: test_Rollup                                   |
|      PREAGGREGATION: ON                                   |
|      PREDICATES: `k1` = 10, `k2` > 200, `k3` IN (1, 2, 3) |
|      partitions=1/1                                       |
|      Rollup: Rollup2                                      |
|      buckets=1/10                                         |
|      cardinality=-1                                       |
|      avgRowSize=0.0                                       |
|      numNodes=0                                           |
|      tuple ids: 0                                         |
```



## Materialized view

A materialized view is a special table that stores a pre-calculated (according to a defined SELECT statement) data set in SelectDB.

The emergence of materialized views is mainly to satisfy users. It can not only analyze any dimension of original detailed data, but also quickly analyze and query fixed dimensions.

**Applicable scene**

- Analysis requirements cover detailed data query and fixed dimension query.
- Queries involve only a small subset of columns or rows in a table.
- The query includes some time-consuming processing operations, such as aggregation operations that take a long time.
- The query needs to match different prefix indexes.

**Advantage**

- The performance of queries that use the same subquery results repeatedly is greatly improved.
- SelectDB automatically maintains the data of the materialized view, whether it is a new import or delete operation, it can ensure the data consistency between the base table and the materialized view table. Without any additional labor maintenance costs.
- When querying, it will automatically match the optimal materialized view and read data directly from the materialized view.

*Automatic maintenance of materialized view data will cause some maintenance overhead, which will be explained in the limitations of materialized views later.*

### Materialized View VS Rollup

Before the materialized view function, users generally used the Rollup function to improve query efficiency through pre-aggregation. But Rollup has certain limitations, he cannot do pre-aggregation based on the detail model.

The materialized view can support more abundant aggregate functions while covering the function of Rollup. So materialized view is actually a superset of Rollup.

That is to say, the functions previously supported by the ALTER TABLE ADD Rollup syntax can now be implemented by CREATE MATERIALIZED VIEW.

### Create a materialized view

SelectDB provides a complete set of DDL syntax for materialized views, including creating, viewing, and deleting. The syntax of DDL is consistent with PostgreSQL and Oracle.

Here, first of all, you have to decide what kind of materialized view to create based on the characteristics of your query statement. This is not to say that it is best if your materialized view definition is exactly the same as one of your query statements. There are two principles here:

1. Abstracted from the query statements, the grouping and aggregation methods shared by multiple queries are used as the definition of the materialized view.
2. It is not necessary to create materialized views for all dimension combinations.

First of all, the first point, if a materialized view is abstracted, and multiple queries can match this materialized view. This materialized view works best. Because the maintenance of the materialized view itself also consumes resources.

If the materialized view is only suitable for a special query, and other queries do not use this materialized view. This will lead to low cost performance of this materialized view, which not only occupies the storage resources of the cluster, but also cannot serve more queries.

Therefore, users need to combine their own query statements and data dimension information to abstract the definition of some materialized views.

The second point is that in actual analysis queries, not all dimensional analysis is covered. Therefore, it is enough to create a materialized view for commonly used dimension combinations, so as to achieve a balance in space and time.

Creating a materialized view is an asynchronous operation, which means that after the user successfully submits the creation task, SelectDB will calculate the stock data in the background until the creation is successful.

**For specific syntax, see CREATE MATERIALIZED VIEW** in the SQL manual .

**Supported Aggregate Functions**

Currently, the aggregate functions supported by the materialized view creation statement are:

- SUM, MIN, MAX (Version 0.12)
- COUNT, BITMAP_UNION, HLL_UNION (Version 0.13)
- The form of BITMAP_UNION must be: `BITMAP_UNION(TO_BITMAP(COLUMN))`The column type can only be an integer (largeint is not supported), or `BITMAP_UNION(COLUMN)`and the base table is an AGG model.
- The form of HLL_UNION must be: `HLL_UNION(HLL_HASH(COLUMN))`the type of the column column cannot be DECIMAL, or `HLL_UNION(COLUMN)`and the base table is an AGG model.

### update strategy

To ensure the data consistency between the materialized view table and the Base table, SelectDB will synchronize operations on the base table such as import and delete to the materialized view table. And the update efficiency is improved through incremental update. Atomicity is guaranteed through transactions.

For example, if the user inserts data into the base table through the INSERT command, this data will be synchronously inserted into the materialized view. When both the base table and the materialized view table are written successfully, the INSERT command will return successfully.

### Query automatic matching

After the materialized view is successfully created, the user's query does not need to be changed, that is, it is still the base table of the query. SelectDB will automatically select an optimal materialized view based on the current query statement, read data from the materialized view and calculate it.

Users can use the EXPLAIN command to check whether the current query uses a materialized view.

The matching relationship between aggregation in materialized view and aggregation in query:

| Materialized View Aggregation | Aggregation in query                                   |
| ----------------------------- | ------------------------------------------------------ |
| sum                           | sum                                                    |
| min                           | min                                                    |
| max                           | max                                                    |
| count                         | count                                                  |
| bitmap_union                  | bitmap_union, bitmap_union_count, count(distinct)      |
| hll_union                     | hll_raw_agg, hll_union_agg, ndv, approx_count_distinct |

After the aggregate function of bitmap and hll matches the materialized view, the aggregate operator of the query will be rewritten according to the table structure of the materialized view. See Example 2 for details.

### Querying a materialized view

Check which materialized views the current table has and what their table structures are like. Through the following command:

```sql
MySQL [test]> desc mv_test all;
+-----------+---------------+-----------------+----------+------+-------+---------+--------------+
| IndexName | IndexKeysType | Field           | Type     | Null | Key   | Default | Extra        |
+-----------+---------------+-----------------+----------+------+-------+---------+--------------+
| mv_test   | DUP_KEYS      | k1              | INT      | Yes  | true  | NULL    |              |
|           |               | k2              | BIGINT   | Yes  | true  | NULL    |              |
|           |               | k3              | LARGEINT | Yes  | true  | NULL    |              |
|           |               | k4              | SMALLINT | Yes  | false | NULL    | NONE         |
|           |               |                 |          |      |       |         |              |
| mv_2      | AGG_KEYS      | k2              | BIGINT   | Yes  | true  | NULL    |              |
|           |               | k4              | SMALLINT | Yes  | false | NULL    | MIN          |
|           |               | k1              | INT      | Yes  | false | NULL    | MAX          |
|           |               |                 |          |      |       |         |              |
| mv_3      | AGG_KEYS      | k1              | INT      | Yes  | true  | NULL    |              |
|           |               | to_bitmap(`k2`) | BITMAP   | No   | false |         | BITMAP_UNION |
|           |               |                 |          |      |       |         |              |
| mv_1      | AGG_KEYS      | k4              | SMALLINT | Yes  | true  | NULL    |              |
|           |               | k1              | BIGINT   | Yes  | false | NULL    | SUM          |
|           |               | k3              | LARGEINT | Yes  | false | NULL    | SUM          |
|           |               | k2              | BIGINT   | Yes  | false | NULL    | MIN          |
+-----------+---------------+-----------------+----------+------+-------+---------+--------------+
```



You can see that the current `mv_test`table has three materialized views: mv_1, mv_2 and mv_3, and their table structures.

### Delete materialized view

If the user no longer needs the materialized view, the materialized view can be dropped by command.

The specific syntax can be found in the SQL manual **DROP MATERIALIZED VIEW** .

### View the created materialized view

Users can view the created materialized view through the command

For specific syntax, see **SHOW CREATE MATERIALIZED VIEW**

### Best practice 1 

Using a materialized view is generally divided into the following steps:

1. Create a materialized view
2. Asynchronously check whether the materialized view is built
3. Query and automatically match materialized views

**First the first step: create a materialized view**

Suppose the user has a sales record list, which stores the transaction id, salesperson, sales store, sales time, and amount of each transaction. The table creation statement is:

```sql
create table sales_records(record_id int, seller_id int, store_id int, sale_date date, sale_amt bigint) distributed by hash(record_id);
```



`sales_records`The table structure of this is as follows:

```sql
MySQL [test]> desc sales_records;
+-----------+--------+------+-------+---------+-------+
| Field     | Type   | Null | Key   | Default | Extra |
+-----------+--------+------+-------+---------+-------+
| record_id | INT    | Yes  | true  | NULL    |       |
| seller_id | INT    | Yes  | true  | NULL    |       |
| store_id  | INT    | Yes  | true  | NULL    |       |
| sale_date | DATE   | Yes  | false | NULL    | NONE  |
| sale_amt  | BIGINT | Yes  | false | NULL    | NONE  |
+-----------+--------+------+-------+---------+-------+
```



At this time, if the user often performs an analysis query on the sales volume of different stores, he can create a materialized view for this `sales_records`table that groups sales stores and sums the sales of the same sales stores. The creation statement is as follows:

```sql
MySQL [test]> create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id;
```



If the backend returns the following figure, it means that the task of creating a materialized view has been submitted successfully.

```sql
Query OK, 0 rows affected (0.012 sec)
```



**Step 2: Check whether the materialized view is built**

Since creating a materialized view is an asynchronous operation, after the user submits the task of creating a materialized view, he needs to asynchronously check whether the materialized view is built through a command. The command is as follows:

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name; 
```



In this command `db_name`is a parameter, you need to replace it with your real db name. The result of the command is to display all tasks that create materialized views for this db. The result is as follows:

```sql
+-------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+-----------+-------------------------------------------------------------------------------------------------------------------------+----------+---------+
| JobId | TableName     | CreateTime          | FinishedTime        | BaseIndexName | RollupIndexName | RollupId | TransactionId | State     | Msg                                                                                                                     | Progress | Timeout |
+-------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+-----------+-------------------------------------------------------------------------------------------------------------------------+----------+---------+
| 22036 | sales_records | 2020-07-30 20:04:28 | 2020-07-30 20:04:57 | sales_records | store_amt       | 22037    | 5008          | FINISHED  |                                                                                                                         | NULL     | 86400   |
+-------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+-----------+-------------------------------------------------------------------------------------------------------------------------+----------+---------+
```



Among them, TableName refers to which table the data of the materialized view comes from, and RollupIndexName refers to the name of the materialized view. One of the more important indicators is State.

When the State of the task of creating a materialized view has changed to FINISHED, it means that the materialized view has been created successfully. This means that it is possible to automatically match this materialized view when querying.

**Step 3: Query**

After the materialized view is created, when the user queries the sales volume of different stores, the aggregated data will `store_amt`be . Achieve the effect of improving query efficiency.

The user's query still specifies the query `sales_records`table , for example:

```sql
SELECT store_id, sum(sale_amt) FROM sales_records GROUP BY store_id;
```



The above query can be automatically matched `store_amt`. Users can use the following command to check whether the current query matches a suitable materialized view.

```sql
EXPLAIN SELECT store_id, sum(sale_amt) FROM sales_records GROUP BY store_id;
+-----------------------------------------------------------------------------+
| Explain String                                                              |
+-----------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                             |
|  OUTPUT EXPRS:<slot 2> `store_id` | <slot 3> sum(`sale_amt`)                |
|   PARTITION: UNPARTITIONED                                                  |
|                                                                             |
|   RESULT SINK                                                               |
|                                                                             |
|   4:EXCHANGE                                                                |
|                                                                             |
| PLAN FRAGMENT 1                                                             |
|  OUTPUT EXPRS:                                                              |
|   PARTITION: HASH_PARTITIONED: <slot 2> `store_id`                          |
|                                                                             |
|   STREAM DATA SINK                                                          |
|     EXCHANGE ID: 04                                                         |
|     UNPARTITIONED                                                           |
|                                                                             |
|   3:AGGREGATE (merge finalize)                                              |
|   |  output: sum(<slot 3> sum(`sale_amt`))                                  |
|   |  group by: <slot 2> `store_id`                                          |
|   |                                                                         |
|   2:EXCHANGE                                                                |
|                                                                             |
| PLAN FRAGMENT 2                                                             |
|  OUTPUT EXPRS:                                                              |
|   PARTITION: RANDOM                                                         |
|                                                                             |
|   STREAM DATA SINK                                                          |
|     EXCHANGE ID: 02                                                         |
|     HASH_PARTITIONED: <slot 2> `store_id`                                   |
|                                                                             |
|   1:AGGREGATE (update serialize)                                            |
|   |  STREAMING                                                              |
|   |  output: sum(`sale_amt`)                                                |
|   |  group by: `store_id`                                                   |
|   |                                                                         |
|   0:OlapScanNode                                                            |
|      TABLE: sales_records                                                   |
|      PREAGGREGATION: ON                                                     |
|      partitions=1/1                                                         |
|      Rollup: store_amt                                                      |
|      tabletRatio=10/10                                                      |
|      tabletList=22038,22040,22042,22044,22046,22048,22050,22052,22054,22056 |
|      cardinality=0                                                          |
|      avgRowSize=0.0                                                         |
|      numNodes=1                                                             |
+-----------------------------------------------------------------------------+
45 rows in set (0.006 sec)
```



The most important of these is the Rollup attribute in OlapScanNode. You can see that the Rollup of the current query is displayed `store_amt`. That is to say, the query has been correctly matched to the materialized view `store_amt`, and the data is read directly from the materialized view.

### Best practice 2: calculate the PV and UV

Business scenario: Calculate the PV and UV of the advertisement.

Assuming that the user's original advertisement click data is stored in SelectDB, then for advertisement PV and UV queries, `bitmap_union`the used to improve the query speed.

Use the following statement to first create a table that stores the details of ad click data, including the click time of each click, what ad was clicked, the channel through which the click was made, and who the user clicked on.

```sql
MySQL [test]> create table advertiser_view_record(time date, advertiser varchar(10), channel varchar(10), user_id int) distributed by hash(time) properties("replication_num" = "1");
Query OK, 0 rows affected (0.014 sec)
```



The original ad click data table structure is:

```sql
MySQL [test]> desc advertiser_view_record;
+------------+-------------+------+-------+---------+-------+
| Field      | Type        | Null | Key   | Default | Extra |
+------------+-------------+------+-------+---------+-------+
| time       | DATE        | Yes  | true  | NULL    |       |
| advertiser | VARCHAR(10) | Yes  | true  | NULL    |       |
| channel    | VARCHAR(10) | Yes  | false | NULL    | NONE  |
| user_id    | INT         | Yes  | false | NULL    | NONE  |
+------------+-------------+------+-------+---------+-------+
4 rows in set (0.001 sec)
```



1. Create a materialized view

   Since what the user wants to query is the UV value of the advertisement, that is, it is necessary to accurately deduplicate the users of the same advertisement, the query is generally:

   ```sql
   SELECT advertiser, channel, count(distinct user_id) FROM advertiser_view_record GROUP BY advertiser, channel;
   ```

   

   For this kind of UV scene, we can create `bitmap_union`a to achieve a pre-accurate deduplication effect.

   In Doris, `count(distinct)`the result of the `bitmap_union_count`aggregation is exactly the same as the result of the aggregation. And the`bitmap_union_count` result of is equal to calculates count, so if the query **involves** **, the query can be** **accelerated by creating a materialized view with aggregation** .`bitmap_union`**`count(distinct)``bitmap_union`**

   For this case, you can create a materialized view `user_id`that .

   ```sql
   MySQL [test]> create materialized view advertiser_uv as select advertiser, channel, bitmap_union(to_bitmap(user_id)) from advertiser_view_record group by advertiser, channel;
   Query OK, 0 rows affected (0.012 sec)
   ```

   

   *Note: because user_id itself is an INT type, it is necessary to `to_bitmap`convert before `bitmap_union`aggregation in Doris.*

   After the creation is complete, the table structure of the ad click list and the materialized view table is as follows:

   ```sql
   MySQL [test]> desc advertiser_view_record all;
   +------------------------+---------------+----------------------+-------------+------+-------+---------+--------------+
   | IndexName              | IndexKeysType | Field                | Type        | Null | Key   | Default | Extra        |
   +------------------------+---------------+----------------------+-------------+------+-------+---------+--------------+
   | advertiser_view_record | DUP_KEYS      | time                 | DATE        | Yes  | true  | NULL    |              |
   |                        |               | advertiser           | VARCHAR(10) | Yes  | true  | NULL    |              |
   |                        |               | channel              | VARCHAR(10) | Yes  | false | NULL    | NONE         |
   |                        |               | user_id              | INT         | Yes  | false | NULL    | NONE         |
   |                        |               |                      |             |      |       |         |              |
   | advertiser_uv          | AGG_KEYS      | advertiser           | VARCHAR(10) | Yes  | true  | NULL    |              |
   |                        |               | channel              | VARCHAR(10) | Yes  | true  | NULL    |              |
   |                        |               | to_bitmap(`user_id`) | BITMAP      | No   | false |         | BITMAP_UNION |
   +------------------------+---------------+----------------------+-------------+------+-------+---------+--------------+
   ```

   

2. query automatic matching

   After the materialized view `advertiser_uv`table . For example, the original query statement is as follows:

   ```sql
   SELECT advertiser, channel, count(distinct user_id) FROM advertiser_view_record GROUP BY advertiser, channel;
   ```

   

   After selecting the materialized view, the actual query will be transformed into:

   ```sql
   SELECT advertiser, channel, bitmap_union_count(to_bitmap(user_id)) FROM advertiser_uv GROUP BY advertiser, channel;
   ```

   

   The EXPLAIN command can be used to check whether SelectDB matches the materialized view:

   ```sql
   MySQL [test]> explain SELECT advertiser, channel, count(distinct user_id) FROM  advertiser_view_record GROUP BY advertiser, channel;
   +-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
   | Explain String                                                                                                                                                    |
   +-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
   | PLAN FRAGMENT 0                                                                                                                                                   |
   |  OUTPUT EXPRS:<slot 7> `advertiser` | <slot 8> `channel` | <slot 9> bitmap_union_count(`default_cluster:test`.`advertiser_view_record`.`mv_bitmap_union_user_id`) |
   |   PARTITION: UNPARTITIONED                                                                                                                                        |
   |                                                                                                                                                                   |
   |   RESULT SINK                                                                                                                                                     |
   |                                                                                                                                                                   |
   |   4:EXCHANGE                                                                                                                                                      |
   |                                                                                                                                                                   |
   | PLAN FRAGMENT 1                                                                                                                                                   |
   |  OUTPUT EXPRS:                                                                                                                                                    |
   |   PARTITION: HASH_PARTITIONED: <slot 4> `advertiser`, <slot 5> `channel`                                                                                          |
   |                                                                                                                                                                   |
   |   STREAM DATA SINK                                                                                                                                                |
   |     EXCHANGE ID: 04                                                                                                                                               |
   |     UNPARTITIONED                                                                                                                                                 |
   |                                                                                                                                                                   |
   |   3:AGGREGATE (merge finalize)                                                                                                                                    |
   |   |  output: bitmap_union_count(<slot 6> bitmap_union_count(`default_cluster:test`.`advertiser_view_record`.`mv_bitmap_union_user_id`))                           |
   |   |  group by: <slot 4> `advertiser`, <slot 5> `channel`                                                                                                          |
   |   |                                                                                                                                                               |
   |   2:EXCHANGE                                                                                                                                                      |
   |                                                                                                                                                                   |
   | PLAN FRAGMENT 2                                                                                                                                                   |
   |  OUTPUT EXPRS:                                                                                                                                                    |
   |   PARTITION: RANDOM                                                                                                                                               |
   |                                                                                                                                                                   |
   |   STREAM DATA SINK                                                                                                                                                |
   |     EXCHANGE ID: 02                                                                                                                                               |
   |     HASH_PARTITIONED: <slot 4> `advertiser`, <slot 5> `channel`                                                                                                   |
   |                                                                                                                                                                   |
   |   1:AGGREGATE (update serialize)                                                                                                                                  |
   |   |  STREAMING                                                                                                                                                    |
   |   |  output: bitmap_union_count(`default_cluster:test`.`advertiser_view_record`.`mv_bitmap_union_user_id`)                                                        |
   |   |  group by: `advertiser`, `channel`                                                                                                                            |
   |   |                                                                                                                                                               |
   |   0:OlapScanNode                                                                                                                                                  |
   |      TABLE: advertiser_view_record                                                                                                                                |
   |      PREAGGREGATION: ON                                                                                                                                           |
   |      partitions=1/1                                                                                                                                               |
   |      Rollup: advertiser_uv                                                                                                                                        |
   |      tabletRatio=10/10                                                                                                                                            |
   |      tabletList=22084,22086,22088,22090,22092,22094,22096,22098,22100,22102                                                                                       |
   |      cardinality=0                                                                                                                                                |
   |      avgRowSize=0.0                                                                                                                                               |
   |      numNodes=1                                                                                                                                                   |
   +-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
   45 rows in set (0.030 sec)
   ```

   

   In the result of EXPLAIN, you can first see that the Rollup property value of OlapScanNode is advertiser_uv. That is, the query scans the materialized view's data directly. Indicates that the match is successful.

   Secondly, for the `user_id`field Seek `count(distinct)`is rewritten as Seek `bitmap_union_count(to_bitmap)`. That is to achieve the effect of accurate deduplication through the way of bitmap.

### Best practice 3 - match richer prefix index

Business scenario: match a richer prefix index

The user's original table has (k1, k2, k3) three columns. Among them, k1 and k2 are prefix index columns. At this time, if the user's query condition includes is, the query `where k1=1 and k2=2`can be accelerated through the index.

But in some cases, the user's filter conditions cannot match the prefix index, for example `where k3=3`. Then the query speed cannot be improved through the index.

Creating a materialized view with k3 as the first column solves this problem.

1. Create a materialized view

   ```sql
   CREATE MATERIALIZED VIEW mv_1 as SELECT k3, k2, k1 FROM tableA ORDER BY k3;
   ```

   

   After the above syntax is created, the materialized view retains complete detailed data, and the prefix index of the materialized view is the k3 column. The table structure is as follows:

   ```sql
   MySQL [test]> desc tableA all;
   +-----------+---------------+-------+------+------+-------+---------+-------+
   | IndexName | IndexKeysType | Field | Type | Null | Key   | Default | Extra |
   +-----------+---------------+-------+------+------+-------+---------+-------+
   | tableA    | DUP_KEYS      | k1    | INT  | Yes  | true  | NULL    |       |
   |           |               | k2    | INT  | Yes  | true  | NULL    |       |
   |           |               | k3    | INT  | Yes  | true  | NULL    |       |
   |           |               |       |      |      |       |         |       |
   | mv_1      | DUP_KEYS      | k3    | INT  | Yes  | true  | NULL    |       |
   |           |               | k2    | INT  | Yes  | false | NULL    | NONE  |
   |           |               | k1    | INT  | Yes  | false | NULL    | NONE  |
   +-----------+---------------+-------+------+------+-------+---------+-------+
   ```

   

2. query match

   At this time, if the filter condition of the k3 column exists in the user's query, for example:

   ```sql
   select k1, k2, k3 from table A where k3=3;
   ```

   

   At this time, the query will directly read data from the mv_1 materialized view just created. The materialized view has a prefix index for k3, and the query efficiency will also be improved.

### Limitations

1. The parameters of the aggregation function of the materialized view do not support the expression and only support a single column, for example: sum(a+b) does not support.
2. If the condition column of the delete statement does not exist in the materialized view, the delete operation cannot be performed. If the data must be deleted, the materialized view needs to be deleted before the data can be deleted.
3. Too many materialized views on a single table will affect the efficiency of import: when importing data, the materialized view and base table data are updated synchronously. If a table has more than 10 materialized views, the import speed may be slow. This is the same as a single import needs to import 10 table data at the same time.
4. The same column and different aggregation functions cannot appear in a materialized view at the same time, for example: select sum(a), min(a) from table is not supported.
5. For the Unique Key data model, the materialized view can only change the order of the columns and cannot perform aggregation. Therefore, it is not possible to perform coarse-grained aggregation operations on the data by creating a materialized view on the Unique Key model.

### Exception rror

DATA_QUALITY_ERR: "The data quality does not satisfy, please check your data" The materialized view creation failed due to data quality problems or Schema Change memory usage exceeding the limit. If it is a memory problem, just increase the `memory_limitation_per_thread_for_schema_change_bytes`parameter. Note: The bitmap type only supports positive integers. If there are negative numbers in the original data, the materialized view creation will fail

### More help

For more detailed syntax and best practices of materialized views, please refer to the SQL manual **CREATE MATERIALIZED VIEW** and **DROP MATERIALIZED VIEW** statements.