# 表修改

## Schema Change

用户可以通过 Schema Change 操作来修改已存在表的 Schema。目前支持以下几种修改:

- 增加、删除列
- 修改列类型
- 调整列顺序
- 增加、修改 BloomFilter Index
- 增加、删除 Bitmap Index

本文档主要介绍如何创建 Schema Change 作业，以及进行 Schema Change 的一些注意事项和常见问题。

执行 Schema Change 的基本过程，是通过原 Index 的数据，生成一份新 Schema 的 Index 的数据。其中主要需要进行两部分数据转换，一是已存在的历史数据的转换，二是在 Schema Change 执行过程中，新到达的导入数据的转换。

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

在开始转换历史数据之前，SelectDB 会获取一个最新的 Transaction ID。并等待这个 Transaction ID 之前的所有导入事务完成。这个 Transaction ID 成为分水岭。意思是，SelectDB 保证在分水岭之后的所有导入任务，都会同时为原 Index 和新 Index 生成数据。这样当历史数据转换完成后，可以保证新的 Index 中的数据是完整的。

### 创建作业

创建 Schema Change 的具体语法可以查看帮助 [ALTER TABLE COLUMN](../../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN.md) 中 Schema Change 部分的说明。

Schema Change 的创建是一个异步过程，作业提交成功后，用户需要通过 `SHOW ALTER TABLE COLUMN` 命令来查看作业进度。

### 查看作业

`SHOW ALTER TABLE COLUMN` 可以查看当前正在执行或已经完成的 Schema Change 作业。当一次 Schema Change 作业涉及到多个 Index 时，该命令会显示多行，每行对应一个 Index。举例如下：

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

- JobId：每个 Schema Change 作业的唯一 ID。
- TableName：Schema Change 对应的基表的表名。
- CreateTime：作业创建时间。
- FinishedTime：作业结束时间。如未结束，则显示 "N/A"。
- IndexName： 本次修改所涉及的某一个 Index 的名称。
- IndexId：新的 Index 的唯一 ID。
- OriginIndexId：旧的 Index 的唯一 ID。
- SchemaVersion：以 M:N 的格式展示。其中 M 表示本次 Schema Change 变更的版本，N 表示对应的 Hash 值。每次 Schema Change，版本都会递增。
- TransactionId：转换历史数据的分水岭 transaction ID。
- State：作业所在阶段。
  - PENDING：作业在队列中等待被调度。
  - WAITING_TXN：等待分水岭 transaction ID 之前的导入任务完成。
  - RUNNING：历史数据转换中。
  - FINISHED：作业成功。
  - CANCELLED：作业失败。
- Msg：如果作业失败，这里会显示失败信息。
- Progress：作业进度。只有在 RUNNING 状态才会显示进度。进度是以 M/N 的形式显示。其中 N 为 Schema Change 涉及的总副本数。M 为已完成历史数据转换的副本数。
- Timeout：作业超时时间。单位秒。

### 取消作业

在作业状态不为 FINISHED 或 CANCELLED 的情况下，可以通过以下命令取消 Schema Change 作业：

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

### 一个作业多个修改

Schema Change 可以在一个作业中，对多个 ROLLUP 进行不同的修改。举例如下：

源 Schema：

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

可以通过以下命令给 rollup1 和 rollup2 都加入一列 k4，并且再给 rollup2 加入一列 k5：

```sql
ALTER TABLE tbl1
ADD COLUMN k4 INT default "1" to rollup1,
ADD COLUMN k4 INT default "1" to rollup2,
ADD COLUMN k5 INT default "1" to rollup2;
```

完成后，Schema 变为：

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

可以看到，Base 表 tbl1 也自动加入了 k4, k5 列。即给任意 rollup 增加的列，都会自动加入到 Base 表中。

同时，不允许向 Rollup 中加入 Base 表已经存在的列。如果用户需要这样做，可以重新建立一个包含新增列的 Rollup，之后再删除原 Rollup。

### 修改 Key 列

修改表的 Key 列是通过 `key` 关键字完成，下面我们通过一个例子来看。

**这个用法只针对 Duplicate key 表的 key 列**

源 Schema :

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

修改语句如下，我们将 k3 列的程度改成 50


```sql
alter table example_tbl modify column k3 varchar(50) key null comment 'to 50'
```

完成后，Schema 变为：

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

因为Schema Chanage 作业是异步操作，同一个表同时只能进行一个Schema chanage 作业，查看作业运行情况，可以通过下面这个命令

```sql
SHOW ALTER TABLE COLUMN\G;
```

### 注意事项

- 一张表在同一时间只能有一个 Schema Change 作业在运行。

- Schema Change 操作不阻塞导入和查询操作。

- 分区列和分桶列不能修改。

- 如果 Schema 中有 REPLACE 方式聚合的 value 列，则不允许删除 Key 列。

  如果删除 Key 列，Doris 无法决定 REPLACE 列的取值。

  Unique 数据模型表的所有非 Key 列都是 REPLACE 聚合方式。

- 在新增聚合类型为 SUM 或者 REPLACE 的 value 列时，该列的默认值对历史数据没有含义。

  因为历史数据已经失去明细信息，所以默认值的取值并不能实际反映聚合后的取值。

- 当修改列类型时，除 Type 以外的字段都需要按原列上的信息补全。

  如修改列 `k1 INT SUM NULL DEFAULT "1"` 类型为 BIGINT，则需执行命令如下：

  `ALTER TABLE tbl1 MODIFY COLUMN `k1` BIGINT SUM NULL DEFAULT "1";`

  注意，除新的列类型外，如聚合方式，Nullable 属性，以及默认值都要按照原信息补全。

- 不支持修改列名称、聚合类型、Nullable 属性、默认值以及列注释。

### 常见问题

- Schema Change 的执行速度

  目前 Schema Change 执行速度按照最差效率估计约为 10MB/s。保守起见，用户可以根据这个速率来设置作业的超时时间。

- 提交作业报错 `Table xxx is not stable. ...`

  Schema Change 只有在表数据完整且非均衡状态下才可以开始。如果表的某些数据分片副本不完整，或者某些副本正在进行均衡操作，则提交会被拒绝。

  数据分片副本是否完整，可以通过以下命令查看：

  `ADMIN SHOW REPLICA STATUS FROM tbl WHERE STATUS != "OK";`

  如果有返回结果，则说明有副本有问题。通常系统会自动修复这些问题，用户也可以通过以下命令优先修复这个表：

  `ADMIN REPAIR TABLE tbl1;`

  用户可以通过以下命令查看是否有正在运行的均衡任务：

  `SHOW PROC "/cluster_balance/pending_tablets";`

  可以等待均衡任务完成，或者通过以下命令临时禁止均衡操作：

  `ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");`



## 表的原子替换

SelectDB 支持对两个表进行原子的替换操作。 该操作仅适用于 OLAP 表。

### 语法说明

```text
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

将表 tbl1 替换为表 tbl2。

如果 `swap` 参数为 `true`，则替换后，名称为 `tbl1` 表中的数据为原 `tbl2` 表中的数据。而名称为 `tbl2` 表中的数据为原 `tbl1` 表中的数据。即两张表数据发生了互换。

如果 `swap` 参数为 `false`，则替换后，名称为 `tbl1` 表中的数据为原 `tbl2` 表中的数据。而名称为 `tbl2` 表被删除。

### 原理

替换表功能，实际上是将以下操作集合变成一个原子操作。

假设要将表 A 替换为表 B，且 `swap` 为 `true`，则操作如下：

1. 将表 B 重名为表 A。
2. 将表 A 重名为表 B。

如果 `swap` 为 `false`，则操作如下：

1. 删除表 A。
2. 将表 B 重名为表 A。

### 注意事项

1. `swap` 参数默认为 `true`。即替换表操作相当于将两张表数据进行交换。
2. 如果设置 `swap` 参数为 `false`，则被替换的表（表A）将被删除，且无法恢复。
3. 替换操作仅能发生在两张 OLAP 表之间，且不会检查两张表的表结构是否一致。
4. 替换操作不会改变原有的权限设置。因为权限检查以表名称为准。

### 最佳实践

原子的覆盖写操作

某些情况下，用户希望能够重写某张表的数据，但如果采用先删除再导入的方式进行，在中间会有一段时间无法查看数据。这时，用户可以先使用 `CREATE TABLE LIKE` 语句创建一个相同结构的新表，将新的数据导入到新表后，通过替换操作，原子的替换旧表，以达到目的。



## 数据的删除恢复

为了避免误操作造成的灾难，SelectDB支持对误删除的数据库/表/分区进行数据恢复，在drop table或者 drop database之后，SelectDB不会立刻对数据进行物理删除，而是在 Trash 中保留一段时间（默认1天，可通过catalog_trash_expire_second参数进行配置），管理员可以通过RECOVER命令对误删除的数据进行恢复。

### 数据的恢复

1.恢复名为 test 的 database

```sql
RECOVER DATABASE test;
```

2.恢复名为 example_tbl 的 table

```sql
RECOVER TABLE test.example_tbl;
```

3.恢复表 example_tbl 中名为 p1 的 partition

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

### 更多帮助

关于 RECOVER 使用的更多详细语法及最佳实践，请参阅SQL手册中的Recover语句。



## 缓存控制

Coming Soon...
