

# ROLLUP 与物化视图

## ROLLUP

ROLLUP 在多维分析中是“上卷”的意思，即将数据按某种指定的粒度进行进一步聚合。

在 SelectDB 中，我们将用户通过建表语句创建出来的表称为 Base 表（Base Table）。Base 表中保存着按用户建表语句指定的方式存储的基础数据。

在 Base 表之上，我们可以创建任意多个 ROLLUP 表。这些 ROLLUP 的数据是基于 Base 表产生的，并且在物理上是**独立存储**的。

ROLLUP 表的基本作用，在于在 Base 表的基础上，获得更粗粒度的聚合数据。

下面我们用示例详细说明在不同数据模型中的 ROLLUP 表及其作用。

###  Aggregate 和 Unique 模型中的 ROLLUP

因为 Unique 只是 Aggregate 模型的一个特例，所以这里我们不加以区别。

**示例1：获得每个用户的总消费**

Base 表结构如下：

| ColumnName      | Type        | AggregationType | Comment                |
| --------------- | ----------- | --------------- | ---------------------- |
| user_id         | LARGEINT    |                 | 用户id                 |
| date            | DATE        |                 | 数据灌入日期           |
| timestamp       | DATETIME    |                 | 数据灌入时间，精确到秒 |
| city            | VARCHAR(20) |                 | 用户所在城市           |
| age             | SMALLINT    |                 | 用户年龄               |
| sex             | TINYINT     |                 | 用户性别               |
| last_visit_date | DATETIME    | REPLACE         | 用户最后一次访问时间   |
| cost            | BIGINT      | SUM             | 用户总消费             |
| max_dwell_time  | INT         | MAX             | 用户最大停留时间       |
| min_dwell_time  | INT         | MIN             | 用户最小停留时间       |

存储的数据如下：

| user_id | date       | timestamp           | city | age  | sex  | last_visit_date     | cost | max_dwell_time | min_dwell_time |
| ------- | ---------- | ------------------- | ---- | ---- | ---- | ------------------- | ---- | -------------- | -------------- |
| 10000   | 2017-10-01 | 2017-10-01 08:00:05 | 北京 | 20   | 0    | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | 2017-10-01 09:00:05 | 北京 | 20   | 0    | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | 2017-10-01 18:12:10 | 北京 | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | 2017-10-02 13:10:00 | 上海 | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | 2017-10-02 13:15:00 | 广州 | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | 2017-10-01 12:12:48 | 深圳 | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | 2017-10-03 12:38:20 | 深圳 | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6              | 6              |

在此基础上，我们创建一个 ROLLUP：

| ColumnName |
| ---------- |
| user_id    |
| cost       |

该 ROLLUP 只包含两列：user_id 和 cost。则创建完成后，该 ROLLUP 中存储的数据如下：

| user_id | cost |
| ------- | ---- |
| 10000   | 35   |
| 10001   | 2    |
| 10002   | 200  |
| 10003   | 30   |
| 10004   | 111  |

可以看到，ROLLUP 中仅保留了每个 user_id，在 cost 列上的 SUM 的结果。那么当我们进行如下查询时:

```sql
SELECT user_id, sum(cost) FROM table GROUP BY user_id;
```

会自动命中这个 ROLLUP 表，从而只需扫描极少的数据量，即可完成这次聚合查询。

** 示例2：获得不同城市，不同年龄段用户的总消费、最长和最短页面驻留时间 **

紧接示例1的Base 表，再创建一个 ROLLUP：

| ColumnName     | Type        | AggregationType | Comment          |
| -------------- | ----------- | --------------- | ---------------- |
| city           | VARCHAR(20) |                 | 用户所在城市     |
| age            | SMALLINT    |                 | 用户年龄         |
| cost           | BIGINT      | SUM             | 用户总消费       |
| max_dwell_time | INT         | MAX             | 用户最大停留时间 |
| min_dwell_time | INT         | MIN             | 用户最小停留时间 |

则创建完成后，该 ROLLUP 中存储的数据如下：

| city | age  | cost | max_dwell_time | min_dwell_time |
| ---- | ---- | ---- | -------------- | -------------- |
| 北京 | 20   | 35   | 10             | 2              |
| 北京 | 30   | 2    | 22             | 22             |
| 上海 | 20   | 200  | 5              | 5              |
| 广州 | 32   | 30   | 11             | 11             |
| 深圳 | 35   | 111  | 6              | 3              |

当我们进行如下这些查询时:

```sql
mysql> SELECT city, age, sum(cost), max(max_dwell_time), min(min_dwell_time) FROM table GROUP BY city, age;
mysql> SELECT city, sum(cost), max(max_dwell_time), min(min_dwell_time) FROM table GROUP BY city;
mysql> SELECT city, age, sum(cost), min(min_dwell_time) FROM table GROUP BY city, age;
```

会自动命中这个 ROLLUP 表。

### Duplicate 模型中的 ROLLUP

因为 Duplicate 模型没有聚合的语意。所以该模型中的 ROLLUP，已经失去了“上卷”这一层含义。而仅仅是作为调整列顺序，以命中前缀索引的作用。

**ROLLUP 调整前缀索引**

因为建表时已经指定了列顺序，所以一个表只有一种前缀索引。这对于使用其他不能命中前缀索引的列作为条件进行的查询来说，效率上可能无法满足需求。因此，我们可以通过创建 ROLLUP 来人为的调整列顺序。举例说明：

Base 表结构如下：

| ColumnName     | Type         |
| -------------- | ------------ |
| user_id        | BIGINT       |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

我们可以在此基础上创建一个 ROLLUP 表：

| ColumnName     | Type         |
| -------------- | ------------ |
| age            | INT          |
| user_id        | BIGINT       |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

可以看到，ROLLUP 和 Base 表的列完全一样，只是将 user_id 和 age 的顺序调换了。那么当我们进行如下查询时：

```sql
mysql> SELECT * FROM table where age=20 and message LIKE "%error%";
```

会优先选择 ROLLUP 表，因为 ROLLUP 的前缀索引匹配度更高。

### ROLLUP使用说明

- ROLLUP 最根本的作用是提高某些查询的查询效率（无论是通过聚合来减少数据量，还是修改列顺序以匹配前缀索引）。因此 ROLLUP 的含义已经超出了 “上卷” 的范围。
- ROLLUP 是附属于 Base 表的，可以看做是 Base 表的一种辅助数据结构。用户可以在 Base 表的基础上，创建或删除 ROLLUP，但是不能在查询中显式的指定查询某 ROLLUP。是否命中 ROLLUP 完全由系统自动决定。
- ROLLUP 的数据是独立物理存储的。因此，创建的 ROLLUP 越多，占用的磁盘空间也就越大。同时对导入速度也会有影响（导入的ETL阶段会自动产生所有 ROLLUP 的数据），但是不会降低查询效率（只会更好）。
- ROLLUP 的数据更新与 Base 表是完全同步的。用户无需关心这个问题。
- ROLLUP 中列的聚合方式，与 Base 表完全相同。在创建 ROLLUP 无需指定，也不能修改。
- 查询能否命中 ROLLUP 的一个必要条件（非充分条件）是，查询所涉及的**所有列**（包括 select list 和 where 中的查询条件列等）都存在于该 ROLLUP 的列中。否则，查询只能命中 Base 表。
- 某些类型的查询（如 count(*)）在任何条件下，都无法命中 ROLLUP。
- 可以通过 `EXPLAIN your_sql;` 命令获得查询执行计划，在执行计划中，查看是否命中 ROLLUP。
- 可以通过 `DESC tbl_name ALL;` 语句显示 Base 表和所有已创建完成的 ROLLUP。

### 查询

在 SelectDB 里 Rollup 作为一份聚合物化视图，其在查询中可以起到两个作用：

- 索引
- 聚合数据（仅用于聚合模型，即aggregate key）

但是为了命中 Rollup 需要满足一定的条件，并且可以通过执行计划中 ScanNode 节点的 PreAggregation 的值来判断是否可以命中 Rollup，以及 Rollup 字段来判断命中的是哪一张 Rollup 表。

#### 索引

前面的索引中已经介绍过 SelectDB 的前缀索引，即会把 Base/Rollup 表中的前 36 个字节（有 varchar 类型则可能导致前缀索引不满 36 个字节，varchar 会截断前缀索引，并且最多使用 varchar 的 20 个字节）在底层存储引擎单独生成一份排序的稀疏索引数据(数据也是排序的，用索引定位，然后在数据中做二分查找)，然后在查询的时候会根据查询中的条件来匹配每个 Base/Rollup 的前缀索引，并且选择出匹配前缀索引最长的一个 Base/Rollup。

```text
       -----> 从左到右匹配
+----+----+----+----+----+----+
| c1 | c2 | c3 | c4 | c5 |... |
```

如上图，取查询中 where 以及 on 上下推到 ScanNode 的条件，从前缀索引的第一列开始匹配，检查条件中是否有这些列，有则累计匹配的长度，直到匹配不上或者36字节结束（varchar类型的列只能匹配20个字节，并且会匹配不足36个字节截断前缀索引），然后选择出匹配长度最长的一个 Base/Rollup，下面举例说明，创建了一张Base表以及四张rollup：

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
| rollup_index1 | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
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
| rollup_index2 | k9    | VARCHAR(20)  | Yes  | true  | N/A     |       |
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
| rollup_index3 | k4    | BIGINT       | Yes  | true  | N/A     |       |
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
| rollup_index4 | k4    | BIGINT       | Yes  | true  | N/A     |       |
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

这五张表的前缀索引分别为

```text
Base(k1 ,k2, k3, k4, k5, k6, k7)

rollup_index1(k9)

rollup_index2(k9)

rollup_index3(k4, k5, k6, k1, k2, k3, k7)

rollup_index4(k4, k6, k5, k1, k2, k3, k7)
```

能用的上前缀索引的列上的条件需要是 `=` `<` `>` `<=` `>=` `in` `between` 这些并且这些条件是并列的且关系使用 `and` 连接，对于`or`、`!=` 等这些不能命中，然后看以下查询：

```sql
SELECT * FROM test WHERE k1 = 1 AND k2 > 3;
```

有 k1 以及 k2 上的条件，检查只有 Base 的第一列含有条件里的 k1，所以匹配最长的前缀索引即 test的base表。

再看以下查询：

```sql
SELECT * FROM test WHERE k4 = 1 AND k5 > 3;
```

有 k4 以及 k5 的条件，检查 rollup_index3、rollup_index4 的第一列含有 k4，但是 rollup_index3 的第二列含有k5，所以匹配的前缀索引最长。

现在我们尝试匹配含有 varchar 列上的条件，如下：

```sql
SELECT * FROM test WHERE k9 IN ("xxx", "yyyy") AND k1 = 10;
```

有 k9 以及 k1 两个条件，rollup_index1 以及 rollup_index2 的第一列都含有 k9，按理说这里选择这两个 rollup 都可以命中前缀索引并且效果是一样的随机选择一个即可（因为这里 varchar 刚好20个字节，前缀索引不足36个字节被截断），但是当前策略这里还会继续匹配 k1，因为 rollup_index1 的第二列为 k1，所以选择了 rollup_index1，其实后面的 k1 条件并不会起到加速的作用。(如果对于前缀索引外的条件需要其可以起到加速查询的目的，可以通过建立 BloomFilter 过滤器加速。一般对于字符串类型建立即可，因为 SelectDB 针对列存在 Block 级别对于整型、日期已经有 Min/Max 索引) 以下是 explain 的结果。

```text
  0:OlapScanNode                                                                                                                                                                                                                                                                                                                                                                                                  
|      TABLE: test                                                                                                                                                                                                                                                                                                                                                                                                  
|      PREAGGREGATION: OFF. Reason: No AggregateInfo                                                                                                                                                                                                                                                                                                                                                                
|      PREDICATES: `k9` IN ('xxx', 'yyyy'), `k1` = 10                                                                                                                                                                                                                                                                                                                                                               
|      partitions=1/1                                                                                                                                                                                                                                                                                                                                                                                               
|      rollup: rollup_index1                                                                                                                                                                                                                                                                                                                                                                                        
|      buckets=1/10                                                                                                                                                                                                                                                                                                                                                                                                 
|      cardinality=-1                                                                                                                                                                                                                                                                                                                                                                                               
|      avgRowSize=0.0                                                                                                                                                                                                                                                                                                                                                                                               
|      numNodes=0                                                                                                                                                                                                                                                                                                                                                                                                   
|      tuple ids: 0
```

最后看一个多张Rollup都可以命中的查询：

```sql
SELECT * FROM test WHERE k4 < 1000 AND k5 = 80 AND k6 >= 10000;
```

有 k4,k5,k6 三个条件，rollup_index3 以及 rollup_index4 的前3列分别含有这三列，所以两者匹配的前缀索引长度一致，选取两者都可以，当前默认的策略为选取了比较早创建的一张 rollup，这里为 rollup_index3。

```text
|   0:OlapScanNode                                                                                                                                                                                                                                                                                                                                                                                                  
|      TABLE: test                                                                                                                                                                                                                                                                                                                                                                                                  
|      PREAGGREGATION: OFF. Reason: No AggregateInfo                                                                                                                                                                                                                                                                                                                                                                
|      PREDICATES: `k4` < 1000, `k5` = 80, `k6` >= 10000.0                                                                                                                                                                                                                                                                                                                                                          
|      partitions=1/1                                                                                                                                                                                                                                                                                                                                                                                               
|      rollup: rollup_index3                                                                                                                                                                                                                                                                                                                                                                                        
|      buckets=10/10                                                                                                                                                                                                                                                                                                                                                                                                
|      cardinality=-1                                                                                                                                                                                                                                                                                                                                                                                               
|      avgRowSize=0.0                                                                                                                                                                                                                                                                                                                                                                                               
|      numNodes=0                                                                                                                                                                                                                                                                                                                                                                                                   
|      tuple ids: 0
```

如果稍微修改上面的查询为：

```
SELECT * FROM test WHERE k4 < 1000 AND k5 = 80 OR k6 >= 10000;
```

则这里的查询不能命中前缀索引。（甚至存储引擎内的任何 Min/Max,BloomFilter 索引都不能起作用)

#### 聚合数据

当然一般的聚合物化视图其聚合数据的功能是必不可少的，这类物化视图对于聚合类查询或报表类查询都有非常大的帮助，要命中聚合物化视图需要下面一些前提：

1. 查询或者子查询中涉及的所有列都存在一张独立的 Rollup 中。
2. 如果查询或者子查询中有 Join，则 Join 的类型需要是 Inner join。

以下是可以命中Rollup的一些聚合查询的种类，

| 列类型 查询类型 | Sum   | Distinct/Count Distinct | Min   | Max   | APPROX_COUNT_DISTINCT |
| --------------- | ----- | ----------------------- | ----- | ----- | --------------------- |
| Key             | false | true                    | true  | true  | true                  |
| Value(Sum)      | true  | false                   | false | false | false                 |
| Value(Replace)  | false | false                   | false | false | false                 |
| Value(Min)      | false | false                   | true  | false | false                 |
| Value(Max)      | false | false                   | false | true  | false                 |

如果符合上述条件，则针对聚合模型在判断命中 Rollup 的时候会有两个阶段：

1. 首先通过条件匹配出命中前缀索引索引最长的 Rollup 表，见上述索引策略。
2. 然后比较 Rollup 的行数，选择最小的一张 Rollup。

如下 Base 表以及 Rollup：

```text
+-------------+-------+--------------+------+-------+---------+-------+
| IndexName   | Field | Type         | Null | Key   | Default | Extra |
+-------------+-------+--------------+------+-------+---------+-------+
| test_rollup | k1    | TINYINT      | Yes  | true  | N/A     |       |
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
| rollup2     | k1    | TINYINT      | Yes  | true  | N/A     |       |
|             | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|             | k3    | INT          | Yes  | true  | N/A     |       |
|             | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|             | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
|             |       |              |      |       |         |       |
| rollup1     | k1    | TINYINT      | Yes  | true  | N/A     |       |
|             | k2    | SMALLINT     | Yes  | true  | N/A     |       |
|             | k3    | INT          | Yes  | true  | N/A     |       |
|             | k4    | BIGINT       | Yes  | true  | N/A     |       |
|             | k5    | DECIMAL(9,3) | Yes  | true  | N/A     |       |
|             | k10   | DOUBLE       | Yes  | false | N/A     | MAX   |
|             | k11   | FLOAT        | Yes  | false | N/A     | SUM   |
+-------------+-------+--------------+------+-------+---------+-------+
```

看以下查询：

```sql
SELECT SUM(k11) FROM test_rollup WHERE k1 = 10 AND k2 > 200 AND k3 in (1,2,3);
```

首先判断查询是否可以命中聚合的 Rollup表，经过查上面的图是可以的，然后条件中含有 k1,k2,k3 三个条件，这三个条件 test_rollup、rollup1、rollup2 的前三列都含有，所以前缀索引长度一致，然后比较行数显然 rollup2 的聚合程度最高行数最少所以选取 rollup2。

```text
|   0:OlapScanNode                                          |
|      TABLE: test_rollup                                   |
|      PREAGGREGATION: ON                                   |
|      PREDICATES: `k1` = 10, `k2` > 200, `k3` IN (1, 2, 3) |
|      partitions=1/1                                       |
|      rollup: rollup2                                      |
|      buckets=1/10                                         |
|      cardinality=-1                                       |
|      avgRowSize=0.0                                       |
|      numNodes=0                                           |
|      tuple ids: 0                                         |
```





## 物化视图

物化视图是将预先计算（根据定义好的 SELECT 语句）好的数据集，存储在 SelectDB 中的一个特殊的表。

物化视图的出现主要是为了满足用户，既能对原始明细数据的任意维度分析，也能快速的对固定维度进行分析查询。

**适用场景**

- 分析需求覆盖明细数据查询以及固定维度查询两方面。
- 查询仅涉及表中的很小一部分列或行。
- 查询包含一些耗时处理操作，比如：时间很久的聚合操作等。
- 查询需要匹配不同前缀索引。

**优势**

- 对于那些经常重复的使用相同的子查询结果的查询性能大幅提升。
- SelectDB自动维护物化视图的数据，无论是新的导入，还是删除操作都能保证base 表和物化视图表的数据一致性。无需任何额外的人工维护成本。
- 查询时，会自动匹配到最优物化视图，并直接从物化视图中读取数据。

*自动维护物化视图的数据会造成一些维护开销，会在后面的物化视图的局限性中展开说明。*

### 物化视图 VS ROLLUP

在没有物化视图功能之前，用户一般都是使用 Rollup 功能通过预聚合方式提升查询效率的。但是 Rollup 具有一定的局限性，他不能基于明细模型做预聚合。

物化视图则在覆盖了 Rollup 的功能的同时，还能支持更丰富的聚合函数。所以物化视图其实是 Rollup 的一个超集。

也就是说，之前 ALTER TABLE ADD ROLLUP 语法支持的功能现在均可以通过 CREATE MATERIALIZED VIEW 实现。

### 创建物化视图

SelectDB提供了一整套对物化视图的 DDL 语法，包括创建，查看，删除。DDL 的语法和 PostgreSQL, Oracle都是一致的。

这里首先你要根据你的查询语句的特点来决定创建一个什么样的物化视图。这里并不是说你的物化视图定义和你的某个查询语句一模一样就最好。这里有两个原则：

1. 从查询语句中**抽象**出，多个查询共有的分组和聚合方式作为物化视图的定义。
2. 不需要给所有维度组合都创建物化视图。

首先第一个点，一个物化视图如果抽象出来，并且多个查询都可以匹配到这张物化视图。这种物化视图效果最好。因为物化视图的维护本身也需要消耗资源。

如果物化视图只和某个特殊的查询很贴合，而其他查询均用不到这个物化视图。则会导致这张物化视图的性价比不高，既占用了集群的存储资源，还不能为更多的查询服务。

所以用户需要结合自己的查询语句，以及数据维度信息去抽象出一些物化视图的定义。

第二点就是，在实际的分析查询中，并不会覆盖到所有的维度分析。所以给常用的维度组合创建物化视图即可，从而到达一个空间和时间上的平衡。

创建物化视图是一个异步的操作，也就是说用户成功提交创建任务后，SelectDB 会在后台对存量的数据进行计算，直到创建成功。

具体的语法可查看SQL手册中的**CREATE MATERIALIZED VIEW**。

**支持的聚合函数**

目前物化视图创建语句支持的聚合函数有：

- SUM, MIN, MAX (Version 0.12)
- COUNT, BITMAP_UNION, HLL_UNION (Version 0.13)
- BITMAP_UNION 的形式必须为：`BITMAP_UNION(TO_BITMAP(COLUMN))` column 列的类型只能是整数（largeint也不支持), 或者 `BITMAP_UNION(COLUMN)` 且 base 表为 AGG 模型。
- HLL_UNION 的形式必须为：`HLL_UNION(HLL_HASH(COLUMN))` column 列的类型不能是 DECIMAL , 或者 `HLL_UNION(COLUMN)` 且 base 表为 AGG 模型。

### 更新策略

为保证物化视图表和 Base 表的数据一致性, SelectDB 会将导入，删除等对 base 表的操作都同步到物化视图表中。并且通过增量更新的方式来提升更新效率。通过事务方式来保证原子性。

比如如果用户通过 INSERT 命令插入数据到 base 表中，则这条数据会同步插入到物化视图中。当 base 表和物化视图表均写入成功后，INSERT 命令才会成功返回。

### 查询自动匹配

物化视图创建成功后，用户的查询不需要发生任何改变，也就是还是查询的 base 表。SelectDB 会根据当前查询的语句去自动选择一个最优的物化视图，从物化视图中读取数据并计算。

用户可以通过 EXPLAIN 命令来检查当前查询是否使用了物化视图。

物化视图中的聚合和查询中聚合的匹配关系：

| 物化视图聚合 | 查询中聚合                                             |
| ------------ | ------------------------------------------------------ |
| sum          | sum                                                    |
| min          | min                                                    |
| max          | max                                                    |
| count        | count                                                  |
| bitmap_union | bitmap_union, bitmap_union_count, count(distinct)      |
| hll_union    | hll_raw_agg, hll_union_agg, ndv, approx_count_distinct |

其中 bitmap 和 hll 的聚合函数在查询匹配到物化视图后，查询的聚合算子会根据物化视图的表结构进行一个改写。详细见实例2。

### 查询物化视图

查看当前表都有哪些物化视图，以及他们的表结构都是什么样的。通过下面命令：

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

可以看到当前 `mv_test` 表一共有三张物化视图：mv_1, mv_2 和 mv_3，以及他们的表结构。

### 删除物化视图

如果用户不再需要物化视图，则可以通过命令删除物化视图。

具体的语法可查看SQL手册**DROP MATERIALIZED VIEW**。

### 查看已创建的物化视图

用户可以通过命令查看已创建的物化视图的

具体的语法可查看**SHOW CREATE MATERIALIZED VIEW**

### 最佳实践-1

使用物化视图一般分为以下几个步骤：

1. 创建物化视图
2. 异步检查物化视图是否构建完成
3. 查询并自动匹配物化视图

**首先是第一步：创建物化视图**


假设用户有一张销售记录明细表，存储了每个交易的交易id，销售员，售卖门店，销售时间，以及金额。建表语句为：

```sql
create table sales_records(record_id int, seller_id int, store_id int, sale_date date, sale_amt bigint) distributed by hash(record_id);
```

这张 `sales_records` 的表结构如下：

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

这时候如果用户经常对不同门店的销售量进行一个分析查询，则可以给这个 `sales_records` 表创建一张以售卖门店分组，对相同售卖门店的销售额求和的一个物化视图。创建语句如下：

```sql
MySQL [test]> create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id;
```

后端返回下图，则说明创建物化视图任务提交成功。

```sql
Query OK, 0 rows affected (0.012 sec)
```

**第二步：检查物化视图是否构建完成**

由于创建物化视图是一个异步的操作，用户在提交完创建物化视图任务后，需要异步的通过命令检查物化视图是否构建完成。命令如下：

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name; 
```

这个命令中 `db_name` 是一个参数, 你需要替换成自己真实的 db 名称。命令的结果是显示这个 db 的所有创建物化视图的任务。结果如下：

```sql
+-------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+-----------+-------------------------------------------------------------------------------------------------------------------------+----------+---------+
| JobId | TableName     | CreateTime          | FinishedTime        | BaseIndexName | RollupIndexName | RollupId | TransactionId | State     | Msg                                                                                                                     | Progress | Timeout |
+-------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+-----------+-------------------------------------------------------------------------------------------------------------------------+----------+---------+
| 22036 | sales_records | 2020-07-30 20:04:28 | 2020-07-30 20:04:57 | sales_records | store_amt       | 22037    | 5008          | FINISHED  |                                                                                                                         | NULL     | 86400   |
+-------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+-----------+-------------------------------------------------------------------------------------------------------------------------+----------+---------+
```

其中 TableName 指的是物化视图的数据来自于哪个表，RollupIndexName 指的是物化视图的名称叫什么。其中比较重要的指标是 State。

当创建物化视图任务的 State 已经变成 FINISHED 后，就说明这个物化视图已经创建成功了。这就意味着，查询的时候有可能自动匹配到这张物化视图了。

**第三步：查询**

当创建完成物化视图后，用户再查询不同门店的销售量时，就会直接从刚才创建的物化视图 `store_amt` 中读取聚合好的数据。达到提升查询效率的效果。

用户的查询依旧指定查询 `sales_records` 表，比如：

```sql
SELECT store_id, sum(sale_amt) FROM sales_records GROUP BY store_id;
```

上面查询就能自动匹配到 `store_amt`。用户可以通过下面命令，检验当前查询是否匹配到了合适的物化视图。

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
|      rollup: store_amt                                                      |
|      tabletRatio=10/10                                                      |
|      tabletList=22038,22040,22042,22044,22046,22048,22050,22052,22054,22056 |
|      cardinality=0                                                          |
|      avgRowSize=0.0                                                         |
|      numNodes=1                                                             |
+-----------------------------------------------------------------------------+
45 rows in set (0.006 sec)
```

其中最重要的就是 OlapScanNode 中的 rollup 属性。可以看到当前查询的 rollup 显示的是 `store_amt`。也就是说查询已经正确匹配到物化视图 `store_amt`, 并直接从物化视图中读取数据了。

### 最佳实践-2 计算广告的PV和UV

业务场景: 计算广告的PV和UV。

假设用户的原始广告点击数据存储在 SelectDB，那么针对广告 PV, UV 查询就可以通过创建 `bitmap_union` 的物化视图来提升查询速度。

通过下面语句首先创建一个存储广告点击数据明细的表，包含每条点击的点击时间，点击的是什么广告，通过什么渠道点击，以及点击的用户是谁。

```sql
MySQL [test]> create table advertiser_view_record(time date, advertiser varchar(10), channel varchar(10), user_id int) distributed by hash(time) properties("replication_num" = "1");
Query OK, 0 rows affected (0.014 sec)
```

原始的广告点击数据表结构为：

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

1. 创建物化视图

   由于用户想要查询的是广告的 UV 值，也就是需要对相同广告的用户进行一个精确去重，则查询一般为：

   ```sql
   SELECT advertiser, channel, count(distinct user_id) FROM advertiser_view_record GROUP BY advertiser, channel;
   ```

   针对这种求 UV 的场景，我们就可以创建一个带 `bitmap_union` 的物化视图从而达到一个预先精确去重的效果。

   在 Doris 中，`count(distinct)` 聚合的结果和 `bitmap_union_count`聚合的结果是完全一致的。而`bitmap_union_count` 等于 `bitmap_union` 的结果求 count， 所以如果查询中**涉及到 `count(distinct)` 则通过创建带 `bitmap_union` 聚合的物化视图方可加快查询**。

   针对这个 case，则可以创建一个根据广告和渠道分组，对 `user_id` 进行精确去重的物化视图。

   ```sql
   MySQL [test]> create materialized view advertiser_uv as select advertiser, channel, bitmap_union(to_bitmap(user_id)) from advertiser_view_record group by advertiser, channel;
   Query OK, 0 rows affected (0.012 sec)
   ```

   *注意：因为本身 user_id 是一个 INT 类型，所以在 Doris 中需要先将字段通过函数 `to_bitmap` 转换为 bitmap 类型然后才可以进行 `bitmap_union` 聚合。*

   创建完成后, 广告点击明细表和物化视图表的表结构如下：

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

2. 查询自动匹配

   当物化视图表创建完成后，查询广告 UV 时，SelectDB就会自动从刚才创建好的物化视图 `advertiser_uv` 中查询数据。比如原始的查询语句如下：

   ```sql
   SELECT advertiser, channel, count(distinct user_id) FROM advertiser_view_record GROUP BY advertiser, channel;
   ```

   在选中物化视图后，实际的查询会转化为：

   ```sql
   SELECT advertiser, channel, bitmap_union_count(to_bitmap(user_id)) FROM advertiser_uv GROUP BY advertiser, channel;
   ```

   通过 EXPLAIN 命令可以检验到 SelectDB 是否匹配到了物化视图：

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
   |      rollup: advertiser_uv                                                                                                                                        |
   |      tabletRatio=10/10                                                                                                                                            |
   |      tabletList=22084,22086,22088,22090,22092,22094,22096,22098,22100,22102                                                                                       |
   |      cardinality=0                                                                                                                                                |
   |      avgRowSize=0.0                                                                                                                                               |
   |      numNodes=1                                                                                                                                                   |
   +-------------------------------------------------------------------------------------------------------------------------------------------------------------------+
   45 rows in set (0.030 sec)
   ```

   在 EXPLAIN 的结果中，首先可以看到 OlapScanNode 的 rollup 属性值为 advertiser_uv。也就是说，查询会直接扫描物化视图的数据。说明匹配成功。

   其次对于 `user_id` 字段求 `count(distinct)` 被改写为求 `bitmap_union_count(to_bitmap)`。也就是通过 bitmap 的方式来达到精确去重的效果。

### 最佳实践 3 - 匹配更丰富的前缀索引

   业务场景：匹配更丰富的前缀索引

   用户的原始表有 （k1, k2, k3） 三列。其中 k1, k2 为前缀索引列。这时候如果用户查询条件中包含 `where k1=1 and k2=2` 就能通过索引加速查询。

   但是有些情况下，用户的过滤条件无法匹配到前缀索引，比如 `where k3=3`。则无法通过索引提升查询速度。

   创建以 k3 作为第一列的物化视图就可以解决这个问题。

   1. 创建物化视图

      ```sql
      CREATE MATERIALIZED VIEW mv_1 as SELECT k3, k2, k1 FROM tableA ORDER BY k3;
      ```

      通过上面语法创建完成后，物化视图中既保留了完整的明细数据，且物化视图的前缀索引为 k3 列。表结构如下：

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

   2. 查询匹配

      这时候如果用户的查询存在 k3 列的过滤条件是，比如：

      ```sql
      select k1, k2, k3 from table A where k3=3;
      ```

      这时候查询就会直接从刚才创建的 mv_1 物化视图中读取数据。物化视图对 k3 是存在前缀索引的，查询效率也会提升。

### 局限性

   1. 物化视图的聚合函数的参数不支持表达式仅支持单列，比如： sum(a+b)不支持。
   2. 如果删除语句的条件列，在物化视图中不存在，则不能进行删除操作。如果一定要删除数据，则需要先将物化视图删除，然后方可删除数据。
   3. 单表上过多的物化视图会影响导入的效率：导入数据时，物化视图和 base 表数据是同步更新的，如果一张表的物化视图表超过10张，则有可能导致导入速度很慢。这就像单次导入需要同时导入10张表数据是一样的。
   4. 相同列，不同聚合函数，不能同时出现在一张物化视图中，比如：select sum(a), min(a) from table 不支持。
   5. 物化视图针对 Unique Key数据模型，只能改变列顺序，不能起到聚合的作用，所以在Unique Key模型上不能通过创建物化视图的方式对数据进行粗粒度聚合操作

### 异常错误

   1. DATA_QUALITY_ERR: "The data quality does not satisfy, please check your data" 由于数据质量问题或者Schema Change内存使用超出限制导致物化视图创建失败。如果是内存问题，调大`memory_limitation_per_thread_for_schema_change_bytes`参数即可。 注意：bitmap类型仅支持正整型, 如果原始数据中存在负数，会导致物化视图创建失败



### 更多帮助

关于物化视图使用的更多详细语法及最佳实践，请参阅SQL手册**CREATE MATERIALIZED VIEW**和**DROP MATERIALIZED VIEW**语句。
