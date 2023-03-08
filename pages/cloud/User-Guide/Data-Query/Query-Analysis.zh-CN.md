# 查询分析

SelectDB 提供了一个图形化的命令以帮助用户更方便的分析一个具体的查询或导入。本文介绍如何使用该功能。

## 查询计划树

SQL 是一个描述性语言，用户通过一个 SQL 来描述想获取的数据。而一个 SQL 的具体执行方式依赖于数据库的实现。而查询规划器就是用来决定数据库如何具体执行一个 SQL 的。

比如用户指定了一个 Join 算子，则查询规划器需要决定具体的 Join 算法，比如是 Hash Join，还是 Merge Sort Join；是使用 Shuffle 还是 Broadcast；Join 顺序是否需要调整以避免笛卡尔积；以及确定最终的在哪些节点执行等等。

SelectDB的查询规划过程是先将一个 SQL 语句转换成一个单机执行计划树。

```text
     ┌────┐
     │Sort│
     └────┘
        │
  ┌───────────┐
  │Aggregation│
  └───────────┘
        │
     ┌────┐
     │Join│
     └────┘
    ┌───┴────┐
┌──────┐ ┌──────┐
│Scan-1│ │Scan-2│
└──────┘ └──────┘
```

之后，查询规划器会根据具体的算子执行方式、数据的具体分布，将单机查询计划转换为分布式查询计划。分布式查询计划是由多个 Fragment 组成的，每个 Fragment 负责查询计划的一部分，各个 Fragment 之间会通过 ExchangeNode 算子进行数据的传输。

```text
        ┌────┐
        │Sort│
        │F1  │
        └────┘
           │
     ┌───────────┐
     │Aggregation│
     │F1         │
     └───────────┘
           │
        ┌────┐
        │Join│
        │F1  │
        └────┘
    ┌──────┴────┐
┌──────┐ ┌────────────┐
│Scan-1│ │ExchangeNode│
│F1    │ │F1          │
└──────┘ └────────────┘
                │
          ┌──────────────┐
          │DataStreamDink│
          │F2            │
          └──────────────┘
                │
            ┌──────┐
            │Scan-2│
            │F2    │
            └──────┘
```

如上图，我们将单机计划分成了两个 Fragment：F1 和 F2。两个 Fragment 之间通过一个 ExchangeNode 节点传输数据。

而一个 Fragment 会进一步的划分为多个 Instance。Instance 是最终具体的执行实例。划分成多个 Instance 有助于充分利用机器资源，提升一个 Fragment 的执行并发度。

## 查看查询计划

可以通过以下三种命令查看一个 SQL 的执行计划。

- `EXPLAIN GRAPH select ...;` 或者 `DESC GRAPH select ...;`
- `EXPLAIN select ...;`
- `EXPLAIN VERBOSE select ...;`

其中第一个命令以图形化的方式展示一个查询计划，这个命令可以比较直观的展示查询计划的树形结构，以及 Fragment 的划分情况：

```sql
mysql> explain graph select tbl1.k1, sum(tbl1.k2) from tbl1 join tbl2 on tbl1.k1 = tbl2.k1 group by tbl1.k1 order by tbl1.k1;
+---------------------------------------------------------------------------------------------------------------------------------+
| Explain String                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                 |
|              ┌───────────────┐                                                                                                  |
|              │[9: ResultSink]│                                                                                                  |
|              │[Fragment: 4]  │                                                                                                  |
|              │RESULT SINK    │                                                                                                  |
|              └───────────────┘                                                                                                  |
|                      │                                                                                                          |
|           ┌─────────────────────┐                                                                                               |
|           │[9: MERGING-EXCHANGE]│                                                                                               |
|           │[Fragment: 4]        │                                                                                               |
|           └─────────────────────┘                                                                                               |
|                      │                                                                                                          |
|            ┌───────────────────┐                                                                                                |
|            │[9: DataStreamSink]│                                                                                                |
|            │[Fragment: 3]      │                                                                                                |
|            │STREAM DATA SINK   │                                                                                                |
|            │  EXCHANGE ID: 09  │                                                                                                |
|            │  UNPARTITIONED    │                                                                                                |
|            └───────────────────┘                                                                                                |
|                      │                                                                                                          |
|               ┌─────────────┐                                                                                                   |
|               │[4: TOP-N]   │                                                                                                   |
|               │[Fragment: 3]│                                                                                                   |
|               └─────────────┘                                                                                                   |
|                      │                                                                                                          |
|      ┌───────────────────────────────┐                                                                                          |
|      │[8: AGGREGATE (merge finalize)]│                                                                                          |
|      │[Fragment: 3]                  │                                                                                          |
|      └───────────────────────────────┘                                                                                          |
|                      │                                                                                                          |
|               ┌─────────────┐                                                                                                   |
|               │[7: EXCHANGE]│                                                                                                   |
|               │[Fragment: 3]│                                                                                                   |
|               └─────────────┘                                                                                                   |
|                      │                                                                                                          |
|            ┌───────────────────┐                                                                                                |
|            │[7: DataStreamSink]│                                                                                                |
|            │[Fragment: 2]      │                                                                                                |
|            │STREAM DATA SINK   │                                                                                                |
|            │  EXCHANGE ID: 07  │                                                                                                |
|            │  HASH_PARTITIONED │                                                                                                |
|            └───────────────────┘                                                                                                |
|                      │                                                                                                          |
|     ┌─────────────────────────────────┐                                                                                         |
|     │[3: AGGREGATE (update serialize)]│                                                                                         |
|     │[Fragment: 2]                    │                                                                                         |
|     │STREAMING                        │                                                                                         |
|     └─────────────────────────────────┘                                                                                         |
|                      │                                                                                                          |
|     ┌─────────────────────────────────┐                                                                                         |
|     │[2: HASH JOIN]                   │                                                                                         |
|     │[Fragment: 2]                    │                                                                                         |
|     │join op: INNER JOIN (PARTITIONED)│                                                                                         |
|     └─────────────────────────────────┘                                                                                         |
|           ┌──────────┴──────────┐                                                                                               |
|    ┌─────────────┐       ┌─────────────┐                                                                                        |
|    │[5: EXCHANGE]│       │[6: EXCHANGE]│                                                                                        |
|    │[Fragment: 2]│       │[Fragment: 2]│                                                                                        |
|    └─────────────┘       └─────────────┘                                                                                        |
|           │                     │                                                                                               |
| ┌───────────────────┐ ┌───────────────────┐                                                                                     |
| │[5: DataStreamSink]│ │[6: DataStreamSink]│                                                                                     |
| │[Fragment: 0]      │ │[Fragment: 1]      │                                                                                     |
| │STREAM DATA SINK   │ │STREAM DATA SINK   │                                                                                     |
| │  EXCHANGE ID: 05  │ │  EXCHANGE ID: 06  │                                                                                     |
| │  HASH_PARTITIONED │ │  HASH_PARTITIONED │                                                                                     |
| └───────────────────┘ └───────────────────┘                                                                                     |
|           │                     │                                                                                               |
|  ┌─────────────────┐   ┌─────────────────┐                                                                                      |
|  │[0: OlapScanNode]│   │[1: OlapScanNode]│                                                                                      |
|  │[Fragment: 0]    │   │[Fragment: 1]    │                                                                                      |
|  │TABLE: tbl1      │   │TABLE: tbl2      │                                                                                      |
|  └─────────────────┘   └─────────────────┘                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------------+
```

从图中可以看出，查询计划树被分为了5个 Fragment：0、1、2、3、4。如 `OlapScanNode` 节点上的 `[Fragment: 0]` 表示这个节点属于 Fragment 0。每个Fragment之间都通过 DataStreamSink 和 ExchangeNode 进行数据传输。

图形命令仅展示简化后的节点信息，如果需要查看更具体的节点信息，如下推到节点上的过滤条件等，则需要通过第二个命令查看更详细的文字版信息：

```sql
mysql> explain select tbl1.k1, sum(tbl1.k2) from tbl1 join tbl2 on tbl1.k1 = tbl2.k1 group by tbl1.k1 order by tbl1.k1;
+----------------------------------------------------------------------------------+
| Explain String                                                                   |
+----------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                  |
|  OUTPUT EXPRS:<slot 5> <slot 3> `tbl1`.`k1` | <slot 6> <slot 4> sum(`tbl1`.`k2`) |
|   PARTITION: UNPARTITIONED                                                       |
|                                                                                  |
|   RESULT SINK                                                                    |
|                                                                                  |
|   9:MERGING-EXCHANGE                                                             |
|      limit: 65535                                                                |
|                                                                                  |
| PLAN FRAGMENT 1                                                                  |
|  OUTPUT EXPRS:                                                                   |
|   PARTITION: HASH_PARTITIONED: <slot 3> `tbl1`.`k1`                              |
|                                                                                  |
|   STREAM DATA SINK                                                               |
|     EXCHANGE ID: 09                                                              |
|     UNPARTITIONED                                                                |
|                                                                                  |
|   4:TOP-N                                                                        |
|   |  order by: <slot 5> <slot 3> `tbl1`.`k1` ASC                                 |
|   |  offset: 0                                                                   |
|   |  limit: 65535                                                                |
|   |                                                                              |
|   8:AGGREGATE (merge finalize)                                                   |
|   |  output: sum(<slot 4> sum(`tbl1`.`k2`))                                      |
|   |  group by: <slot 3> `tbl1`.`k1`                                              |
|   |  cardinality=-1                                                              |
|   |                                                                              |
|   7:EXCHANGE                                                                     |
|                                                                                  |
| PLAN FRAGMENT 2                                                                  |
|  OUTPUT EXPRS:                                                                   |
|   PARTITION: HASH_PARTITIONED: `tbl1`.`k1`                                       |
|                                                                                  |
|   STREAM DATA SINK                                                               |
|     EXCHANGE ID: 07                                                              |
|     HASH_PARTITIONED: <slot 3> `tbl1`.`k1`                                       |
|                                                                                  |
|   3:AGGREGATE (update serialize)                                                 |
|   |  STREAMING                                                                   |
|   |  output: sum(`tbl1`.`k2`)                                                    |
|   |  group by: `tbl1`.`k1`                                                       |
|   |  cardinality=-1                                                              |
|   |                                                                              |
|   2:HASH JOIN                                                                    |
|   |  join op: INNER JOIN (PARTITIONED)                                           |
|   |  runtime filter: false                                                       |
|   |  hash predicates:                                                            |
|   |  colocate: false, reason: table not in the same group                        |
|   |  equal join conjunct: `tbl1`.`k1` = `tbl2`.`k1`                              |
|   |  cardinality=2                                                               |
|   |                                                                              |
|   |----6:EXCHANGE                                                                |
|   |                                                                              |
|   5:EXCHANGE                                                                     |
|                                                                                  |
| PLAN FRAGMENT 3                                                                  |
|  OUTPUT EXPRS:                                                                   |
|   PARTITION: RANDOM                                                              |
|                                                                                  |
|   STREAM DATA SINK                                                               |
|     EXCHANGE ID: 06                                                              |
|     HASH_PARTITIONED: `tbl2`.`k1`                                                |
|                                                                                  |
|   1:OlapScanNode                                                                 |
|      TABLE: tbl2                                                                 |
|      PREAGGREGATION: ON                                                          |
|      partitions=1/1                                                              |
|      rollup: tbl2                                                                |
|      tabletRatio=3/3                                                             |
|      tabletList=105104776,105104780,105104784                                    |
|      cardinality=1                                                               |
|      avgRowSize=4.0                                                              |
|      numNodes=6                                                                  |
|                                                                                  |
| PLAN FRAGMENT 4                                                                  |
|  OUTPUT EXPRS:                                                                   |
|   PARTITION: RANDOM                                                              |
|                                                                                  |
|   STREAM DATA SINK                                                               |
|     EXCHANGE ID: 05                                                              |
|     HASH_PARTITIONED: `tbl1`.`k1`                                                |
|                                                                                  |
|   0:OlapScanNode                                                                 |
|      TABLE: tbl1                                                                 |
|      PREAGGREGATION: ON                                                          |
|      partitions=1/1                                                              |
|      rollup: tbl1                                                                |
|      tabletRatio=3/3                                                             |
|      tabletList=105104752,105104763,105104767                                    |
|      cardinality=2                                                               |
|      avgRowSize=8.0                                                              |
|      numNodes=6                                                                  |
+----------------------------------------------------------------------------------+
```

第三个命令`EXPLAIN VERBOSE select ...;`相比第二个命令可以查看更详细的执行计划信息。

```sql
mysql> explain verbose select tbl1.k1, sum(tbl1.k2) from tbl1 join tbl2 on tbl1.k1 = tbl2.k1 group by tbl1.k1 order by tbl1.k1;
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| Explain String                                                                                                                                          |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                                         |
|   OUTPUT EXPRS:<slot 5> <slot 3> `tbl1`.`k1` | <slot 6> <slot 4> sum(`tbl1`.`k2`)                                                                       |
|   PARTITION: UNPARTITIONED                                                                                                                              |
|                                                                                                                                                         |
|   VRESULT SINK                                                                                                                                          |
|                                                                                                                                                         |
|   6:VMERGING-EXCHANGE                                                                                                                                   |
|      limit: 65535                                                                                                                                       |
|      tuple ids: 3                                                                                                                                       |
|                                                                                                                                                         |
| PLAN FRAGMENT 1                                                                                                                                         |
|                                                                                                                                                         |
|   PARTITION: HASH_PARTITIONED: `default_cluster:test`.`tbl1`.`k2`                                                                                       |
|                                                                                                                                                         |
|   STREAM DATA SINK                                                                                                                                      |
|     EXCHANGE ID: 06                                                                                                                                     |
|     UNPARTITIONED                                                                                                                                       |
|                                                                                                                                                         |
|   4:VTOP-N                                                                                                                                              |
|   |  order by: <slot 5> <slot 3> `tbl1`.`k1` ASC                                                                                                        |
|   |  offset: 0                                                                                                                                          |
|   |  limit: 65535                                                                                                                                       |
|   |  tuple ids: 3                                                                                                                                       |
|   |                                                                                                                                                     |
|   3:VAGGREGATE (update finalize)                                                                                                                        |
|   |  output: sum(<slot 8>)                                                                                                                              |
|   |  group by: <slot 7>                                                                                                                                 |
|   |  cardinality=-1                                                                                                                                     |
|   |  tuple ids: 2                                                                                                                                       |
|   |                                                                                                                                                     |
|   2:VHASH JOIN                                                                                                                                          |
|   |  join op: INNER JOIN(BROADCAST)[Tables are not in the same group]                                                                                   |
|   |  equal join conjunct: CAST(`tbl1`.`k1` AS DATETIME) = `tbl2`.`k1`                                                                                   |
|   |  runtime filters: RF000[in_or_bloom] <- `tbl2`.`k1`                                                                                                 |
|   |  cardinality=0                                                                                                                                      |
|   |  vec output tuple id: 4  |  tuple ids: 0 1                                                                                                          |
|   |                                                                                                                                                     |
|   |----5:VEXCHANGE                                                                                                                                      |
|   |       tuple ids: 1                                                                                                                                  |
|   |                                                                                                                                                     |
|   0:VOlapScanNode                                                                                                                                       |
|      TABLE: tbl1(null), PREAGGREGATION: OFF. Reason: the type of agg on StorageEngine's Key column should only be MAX or MIN.agg expr: sum(`tbl1`.`k2`) |
|      runtime filters: RF000[in_or_bloom] -> CAST(`tbl1`.`k1` AS DATETIME)                                                                               |
|      partitions=0/1, tablets=0/0, tabletList=                                                                                                           |
|      cardinality=0, avgRowSize=20.0, numNodes=1                                                                                                         |
|      tuple ids: 0                                                                                                                                       |
|                                                                                                                                                         |
| PLAN FRAGMENT 2                                                                                                                                         |
|                                                                                                                                                         |
|   PARTITION: HASH_PARTITIONED: `default_cluster:test`.`tbl2`.`k2`                                                                                       |
|                                                                                                                                                         |
|   STREAM DATA SINK                                                                                                                                      |
|     EXCHANGE ID: 05                                                                                                                                     |
|     UNPARTITIONED                                                                                                                                       |
|                                                                                                                                                         |
|   1:VOlapScanNode                                                                                                                                       |
|      TABLE: tbl2(null), PREAGGREGATION: OFF. Reason: null                                                                                               |
|      partitions=0/1, tablets=0/0, tabletList=                                                                                                           |
|      cardinality=0, avgRowSize=16.0, numNodes=1                                                                                                         |
|      tuple ids: 1                                                                                                                                       |
|                                                                                                                                                         |
| Tuples:                                                                                                                                                 |
| TupleDescriptor{id=0, tbl=tbl1, byteSize=32, materialized=true}                                                                                         |
|   SlotDescriptor{id=0, col=k1, type=DATE}                                                                                                               |
|     parent=0                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=16                                                                                                                                         |
|     byteOffset=16                                                                                                                                       |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=1                                                                                                                                           |
|                                                                                                                                                         |
|   SlotDescriptor{id=2, col=k2, type=INT}                                                                                                                |
|     parent=0                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=4                                                                                                                                          |
|     byteOffset=0                                                                                                                                        |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=0                                                                                                                                           |
|                                                                                                                                                         |
|                                                                                                                                                         |
| TupleDescriptor{id=1, tbl=tbl2, byteSize=16, materialized=true}                                                                                         |
|   SlotDescriptor{id=1, col=k1, type=DATETIME}                                                                                                           |
|     parent=1                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=16                                                                                                                                         |
|     byteOffset=0                                                                                                                                        |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=0                                                                                                                                           |
|                                                                                                                                                         |
|                                                                                                                                                         |
| TupleDescriptor{id=2, tbl=null, byteSize=32, materialized=true}                                                                                         |
|   SlotDescriptor{id=3, col=null, type=DATE}                                                                                                             |
|     parent=2                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=16                                                                                                                                         |
|     byteOffset=16                                                                                                                                       |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=1                                                                                                                                           |
|                                                                                                                                                         |
|   SlotDescriptor{id=4, col=null, type=BIGINT}                                                                                                           |
|     parent=2                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=8                                                                                                                                          |
|     byteOffset=0                                                                                                                                        |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=0                                                                                                                                           |
|                                                                                                                                                         |
|                                                                                                                                                         |
| TupleDescriptor{id=3, tbl=null, byteSize=32, materialized=true}                                                                                         |
|   SlotDescriptor{id=5, col=null, type=DATE}                                                                                                             |
|     parent=3                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=16                                                                                                                                         |
|     byteOffset=16                                                                                                                                       |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=1                                                                                                                                           |
|                                                                                                                                                         |
|   SlotDescriptor{id=6, col=null, type=BIGINT}                                                                                                           |
|     parent=3                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=8                                                                                                                                          |
|     byteOffset=0                                                                                                                                        |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=0                                                                                                                                           |
|                                                                                                                                                         |
|                                                                                                                                                         |
| TupleDescriptor{id=4, tbl=null, byteSize=48, materialized=true}                                                                                         |
|   SlotDescriptor{id=7, col=k1, type=DATE}                                                                                                               |
|     parent=4                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=16                                                                                                                                         |
|     byteOffset=16                                                                                                                                       |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=1                                                                                                                                           |
|                                                                                                                                                         |
|   SlotDescriptor{id=8, col=k2, type=INT}                                                                                                                |
|     parent=4                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=4                                                                                                                                          |
|     byteOffset=0                                                                                                                                        |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=0                                                                                                                                           |
|                                                                                                                                                         |
|   SlotDescriptor{id=9, col=k1, type=DATETIME}                                                                                                           |
|     parent=4                                                                                                                                            |
|     materialized=true                                                                                                                                   |
|     byteSize=16                                                                                                                                         |
|     byteOffset=32                                                                                                                                       |
|     nullIndicatorByte=0                                                                                                                                 |
|     nullIndicatorBit=-1                                                                                                                                 |
|     slotIdx=2                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
160 rows in set (0.00 sec)
```


> 查询计划中显示的信息还在不断规范和完善中，我们将在后续的文章中详细介绍。

## 查看查询 Profile

用户可以通过以下命令打开会话变量 `is_report_success`：

```sql
SET is_report_success=true;
```

然后执行查询，则 Doris 会产生该查询的一个 Profile。Profile 包含了一个查询各个节点的具体执行情况，有助于我们分析查询瓶颈。

执行完查询后，我们可以通过如下命令先获取 Profile 列表：

```sql
mysql> show query profile "/"\G
*************************** 1. row ***************************
   QueryId: c257c52f93e149ee-ace8ac14e8c9fef9
      User: root
 DefaultDb: default_cluster:db1
       SQL: select tbl1.k1, sum(tbl1.k2) from tbl1 join tbl2 on tbl1.k1 = tbl2.k1 group by tbl1.k1 order by tbl1.k1
 QueryType: Query
 StartTime: 2021-04-08 11:30:50
   EndTime: 2021-04-08 11:30:50
 TotalTime: 9ms
QueryState: EOF
```

这个命令会列出当前保存的所有 Profile。每行对应一个查询。我们可以选择我们想看的 Profile 对应的 QueryId，查看具体情况。

查看一个Profile分为3个步骤：

1. 查看整体执行计划树

   这一步主要用于从整体分析执行计划，并查看每个Fragment的执行耗时。

   ```sql
   mysql> show query profile "/c257c52f93e149ee-ace8ac14e8c9fef9"\G
   *************************** 1. row ***************************
   Fragments:
                ┌──────────────────────┐
                │[-1: DataBufferSender]│
                │Fragment: 0           │
                │MaxActiveTime: 6.626ms│
                └──────────────────────┘
                            │
                  ┌──────────────────┐
                  │[9: EXCHANGE_NODE]│
                  │Fragment: 0       │
                  └──────────────────┘
                            │
                ┌──────────────────────┐
                │[9: DataStreamSender] │
                │Fragment: 1           │
                │MaxActiveTime: 5.449ms│
                └──────────────────────┘
                            │
                    ┌──────────────┐
                    │[4: SORT_NODE]│
                    │Fragment: 1   │
                    └──────────────┘
                           ┌┘
                ┌─────────────────────┐
                │[8: AGGREGATION_NODE]│
                │Fragment: 1          │
                └─────────────────────┘
                           └┐
                  ┌──────────────────┐
                  │[7: EXCHANGE_NODE]│
                  │Fragment: 1       │
                  └──────────────────┘
                            │
                ┌──────────────────────┐
                │[7: DataStreamSender] │
                │Fragment: 2           │
                │MaxActiveTime: 3.505ms│
                └──────────────────────┘
                           ┌┘
                ┌─────────────────────┐
                │[3: AGGREGATION_NODE]│
                │Fragment: 2          │
                └─────────────────────┘
                           │
                 ┌───────────────────┐
                 │[2: HASH_JOIN_NODE]│
                 │Fragment: 2        │
                 └───────────────────┘
              ┌────────────┴────────────┐
    ┌──────────────────┐      ┌──────────────────┐
    │[5: EXCHANGE_NODE]│      │[6: EXCHANGE_NODE]│
    │Fragment: 2       │      │Fragment: 2       │
    └──────────────────┘      └──────────────────┘
              │                         │
   ┌─────────────────────┐ ┌────────────────────────┐
   │[5: DataStreamSender]│ │[6: DataStreamSender]   │
   │Fragment: 4          │ │Fragment: 3             │
   │MaxActiveTime: 1.87ms│ │MaxActiveTime: 636.767us│
   └─────────────────────┘ └────────────────────────┘
              │                        ┌┘
    ┌───────────────────┐    ┌───────────────────┐
    │[0: OLAP_SCAN_NODE]│    │[1: OLAP_SCAN_NODE]│
    │Fragment: 4        │    │Fragment: 3        │
    └───────────────────┘    └───────────────────┘
              │                        │
       ┌─────────────┐          ┌─────────────┐
       │[OlapScanner]│          │[OlapScanner]│
       │Fragment: 4  │          │Fragment: 3  │
       └─────────────┘          └─────────────┘
              │                        │
     ┌─────────────────┐      ┌─────────────────┐
     │[SegmentIterator]│      │[SegmentIterator]│
     │Fragment: 4      │      │Fragment: 3      │
     └─────────────────┘      └─────────────────┘
   
   1 row in set (0.02 sec)
   ```

   如上图，每个节点都标注了自己所属的 Fragment，并且在每个 Fragment 的 Sender节点，标注了该 Fragment 的执行耗时。这个耗时，是Fragment下所有 Instance 执行耗时中最长的一个。这个有助于我们从整体角度发现最耗时的 Fragment。

2. 查看具体 Fragment 下的 Instance 列表

   比如我们发现 Fragment 1 耗时最长，则可以继续查看 Fragment 1 的 Instance 列表：
   
   ```sql
   mysql> show query profile "/c257c52f93e149ee-ace8ac14e8c9fef9/1";
   +-----------------------------------+-------------------+------------+
   | Instances                         | Host              | ActiveTime |
   +-----------------------------------+-------------------+------------+
   | c257c52f93e149ee-ace8ac14e8c9ff03 | 10.200.00.01:9060 | 5.449ms    |
   | c257c52f93e149ee-ace8ac14e8c9ff05 | 10.200.00.02:9060 | 5.367ms    |
   | c257c52f93e149ee-ace8ac14e8c9ff04 | 10.200.00.03:9060 | 5.358ms    |
   +-----------------------------------+-------------------+------------+ 
   ```
   
   这里展示了 Fragment 1 上所有的 3 个 Instance 所在的执行节点和耗时。

1. 查看具体 Instance

   我们可以继续查看某一个具体的 Instance 上各个算子的详细 Profile：

   ```sql
   mysql> show query profile "/c257c52f93e149ee-ace8ac14e8c9fef9/1/c257c52f93e149ee-ace8ac14e8c9ff03"\G
   *************************** 1. row ***************************
   Instance:
    ┌───────────────────────────────────────┐
    │[9: DataStreamSender]                  │
    │(Active: 37.222us, non-child: 0.40)    │
    │  - Counters:                          │
    │      - BytesSent: 0.00                │
    │      - IgnoreRows: 0                  │
    │      - OverallThroughput: 0.0 /sec    │
    │      - PeakMemoryUsage: 8.00 KB       │
    │      - SerializeBatchTime: 0ns        │
    │      - UncompressedRowBatchSize: 0.00 │
    └───────────────────────────────────────┘
                        └┐
                         │
       ┌──────────────────────────────────┐
       │[4: SORT_NODE]                    │
       │(Active: 5.421ms, non-child: 0.71)│
       │  - Counters:                     │
       │      - PeakMemoryUsage: 12.00 KB │
       │      - RowsReturned: 0           │
       │      - RowsReturnedRate: 0       │
       └──────────────────────────────────┘
                        ┌┘
                        │
      ┌───────────────────────────────────┐
      │[8: AGGREGATION_NODE]              │
      │(Active: 5.355ms, non-child: 10.68)│
      │  - Counters:                      │
      │      - BuildTime: 3.701us         │
      │      - GetResultsTime: 0ns        │
      │      - HTResize: 0                │
      │      - HTResizeTime: 1.211us      │
      │      - HashBuckets: 0             │
      │      - HashCollisions: 0          │
      │      - HashFailedProbe: 0         │
      │      - HashFilledBuckets: 0       │
      │      - HashProbe: 0               │
      │      - HashTravelLength: 0        │
      │      - LargestPartitionPercent: 0 │
      │      - MaxPartitionLevel: 0       │
      │      - NumRepartitions: 0         │
      │      - PartitionsCreated: 16      │
      │      - PeakMemoryUsage: 34.02 MB  │
      │      - RowsProcessed: 0           │
      │      - RowsRepartitioned: 0       │
      │      - RowsReturned: 0            │
      │      - RowsReturnedRate: 0        │
      │      - SpilledPartitions: 0       │
      └───────────────────────────────────┘
                        └┐
                         │
   ┌──────────────────────────────────────────┐
   │[7: EXCHANGE_NODE]                        │
   │(Active: 4.360ms, non-child: 46.84)       │
   │  - Counters:                             │
   │      - BytesReceived: 0.00               │
   │      - ConvertRowBatchTime: 387ns        │
   │      - DataArrivalWaitTime: 4.357ms      │
   │      - DeserializeRowBatchTimer: 0ns     │
   │      - FirstBatchArrivalWaitTime: 4.356ms│
   │      - PeakMemoryUsage: 0.00             │
   │      - RowsReturned: 0                   │
   │      - RowsReturnedRate: 0               │
   │      - SendersBlockedTotalTimer(*): 0ns  │
   └──────────────────────────────────────────┘
   ```

   上图展示了 Fragment 1 中，Instance c257c52f93e149ee-ace8ac14e8c9ff03 的各个算子的具体 Profile。

通过以上3个步骤，我们可以逐步排查一个SQL的性能瓶颈。

## Profile参数解析

BE端收集的统计信息较多，下面列出了各个参数的对应含义：

#### `Fragment`

   - AverageThreadTokens: 执行Fragment使用线程数目，不包含线程池的使用情况
   - Buffer Pool PeakReservation: Buffer Pool使用的内存的峰值
   - MemoryLimit: 查询时的内存限制
   - PeakMemoryUsage: 整个Instance在查询时内存使用的峰值
   - RowsProduced: 处理列的行数

#### `BlockMgr`

  - BlocksCreated: BlockMgr创建的Blocks数目
  - BlocksRecycled: 重用的Blocks数目
  - BytesWritten: 总的落盘写数据量
  - MaxBlockSize: 单个Block的大小
  - TotalReadBlockTime: 读Block的总耗时

#### `DataStreamSender`

   - BytesSent: 发送的总数据量 = 接受者 * 发送数据量
   - IgnoreRows: 过滤的行数
   - LocalBytesSent: 数据在Exchange过程中，记录本机节点的自发自收数据量
   - OverallThroughput: 总的吞吐量 = BytesSent / 时间
   - SerializeBatchTime: 发送数据序列化消耗的时间
   - UncompressedRowBatchSize: 发送数据压缩前的RowBatch的大小

#### `ODBC_TABLE_SINK`

   - NumSentRows: 写入外表的总行数
   - TupleConvertTime: 发送数据序列化为Insert语句的耗时
   - ResultSendTime: 通过ODBC Driver写入的耗时

#### `EXCHANGE_NODE`

  - BytesReceived: 通过网络接收的数据量大小
  - MergeGetNext: 当下层节点存在排序时，会在EXCHANGE NODE进行统一的归并排序，输出有序结果。该指标记录了Merge排序的总耗时，包含了MergeGetNextBatch耗时。
  - MergeGetNextBatch：Merge节点取数据的耗时，如果为单层Merge排序，则取数据的对象为网络队列。若为多层Merge排序取数据对象为Child Merger。
  - ChildMergeGetNext: 当下层的发送数据的Sender过多时，单线程的Merge会成为性能瓶颈，Doris会启动多个Child Merge线程并行归并排序。记录了Child Merge的排序耗时  该数值是多个线程的累加值。
  - ChildMergeGetNextBatch: Child Merge节点从取数据的耗时，如果耗时过大，可能的瓶颈为下层的数据发送节点。 
  - DataArrivalWaitTime: 等待Sender发送数据的总时间
  - FirstBatchArrivalWaitTime: 等待第一个batch从Sender获取的时间
  - DeserializeRowBatchTimer: 反序列化网络数据的耗时
  - SendersBlockedTotalTimer(*): DataStreamRecv的队列的内存被打满，Sender端等待的耗时
  - ConvertRowBatchTime: 接收数据转为RowBatch的耗时
  - RowsReturned: 接收行的数目
  - RowsReturnedRate: 接收行的速率

#### `SORT_NODE`

  - InMemorySortTime: 内存之中的排序耗时
  - InitialRunsCreated: 初始化排序的趟数（如果内存排序的话，该数为1）
  - SortDataSize: 总的排序数据量
  - MergeGetNext: MergeSort从多个sort_run获取下一个batch的耗时 (仅在落盘时计时）
  - MergeGetNextBatch: MergeSort提取下一个sort_run的batch的耗时 (仅在落盘时计时）
  - TotalMergesPerformed: 进行外排merge的次数

#### `AGGREGATION_NODE`

  - PartitionsCreated: 聚合查询拆分成Partition的个数
  - GetResultsTime: 从各个partition之中获取聚合结果的时间
  - HTResizeTime:  HashTable进行resize消耗的时间
  - HTResize:  HashTable进行resize的次数
  - HashBuckets:  HashTable中Buckets的个数
  - HashBucketsWithDuplicate:  HashTable有DuplicateNode的Buckets的个数
  - HashCollisions:  HashTable产生哈希冲突的次数
  - HashDuplicateNodes:  HashTable出现Buckets相同DuplicateNode的个数
  - HashFailedProbe:  HashTable Probe操作失败的次数
  - HashFilledBuckets:  HashTable填入数据的Buckets数目
  - HashProbe:  HashTable查询的次数
  - HashTravelLength:  HashTable查询时移动的步数

#### `HASH_JOIN_NODE`

  - ExecOption: 对右孩子构造HashTable的方式（同步or异步），Join中右孩子可能是表或子查询，左孩子同理
  - BuildBuckets: HashTable中Buckets的个数
  - BuildRows: HashTable的行数
  - BuildTime: 构造HashTable的耗时
  - LoadFactor: HashTable的负载因子（即非空Buckets的数量）
  - ProbeRows: 遍历左孩子进行Hash Probe的行数
  - ProbeTime: 遍历左孩子进行Hash Probe的耗时，不包括对左孩子RowBatch调用GetNext的耗时
  - PushDownComputeTime: 谓词下推条件计算耗时
  - PushDownTime: 谓词下推的总耗时，Join时对满足要求的右孩子，转为左孩子的in查询

#### `CROSS_JOIN_NODE`

  - ExecOption: 对右孩子构造RowBatchList的方式（同步or异步）
  - BuildRows: RowBatchList的行数（即右孩子的行数）
  - BuildTime: 构造RowBatchList的耗时
  - LeftChildRows: 左孩子的行数
  - LeftChildTime: 遍历左孩子，和右孩子求笛卡尔积的耗时，不包括对左孩子RowBatch调用GetNext的耗时

#### `UNION_NODE`

  - MaterializeExprsEvaluateTime: Union两端字段类型不一致时，类型转换表达式计算及物化结果的耗时

#### `ANALYTIC_EVAL_NODE`

  - EvaluationTime: 分析函数（窗口函数）计算总耗时
  - GetNewBlockTime: 初始化时申请一个新的Block的耗时，Block用来缓存Rows窗口或整个分区，用于分析函数计算
  - PinTime: 后续申请新的Block或将写入磁盘的Block重新读取回内存的耗时
  - UnpinTime: 对暂不需要使用的Block或当前操作符内存压力大时，将Block的数据刷入磁盘的耗时

#### `OLAP_SCAN_NODE`

`OLAP_SCAN_NODE` 节点负责具体的数据扫描任务。一个 `OLAP_SCAN_NODE` 会生成一个或多个 `OlapScanner` 。每个 Scanner 线程负责扫描部分数据。

查询中的部分或全部谓词条件会推送给 `OLAP_SCAN_NODE`。这些谓词条件中一部分会继续下推给存储引擎，以便利用存储引擎的索引进行数据过滤。另一部分会保留在 `OLAP_SCAN_NODE` 中，用于过滤从存储引擎中返回的数据。

`OLAP_SCAN_NODE` 节点的 Profile 通常用于分析数据扫描的效率，依据调用关系分为 `OLAP_SCAN_NODE`、`OlapScanner`、`SegmentIterator` 三层。

一个典型的 `OLAP_SCAN_NODE` 节点的 Profile 如下。部分指标会因存储格式的不同（V1 或 V2）而有不同含义。

```
OLAP_SCAN_NODE (id=0):(Active: 1.2ms, % non-child: 0.00%)
  - BytesRead: 265.00 B                 # 从数据文件中读取到的数据量。假设读取到了是10个32位整型，则数据量为 10 * 4B = 40 Bytes。这个数据仅表示数据在内存中全展开的大小，并不代表实际的 IO 大小。 
  - NumDiskAccess: 1                    # 该 ScanNode 节点涉及到的磁盘数量。
  - NumScanners: 20                     # 该 ScanNode 生成的 Scanner 数量。
  - PeakMemoryUsage: 0.00               # 查询时内存使用的峰值，暂未使用
  - RowsRead: 7                         # 从存储引擎返回到 Scanner 的行数，不包括经 Scanner 过滤的行数。
  - RowsReturned: 7                     # 从 ScanNode 返回给上层节点的行数。
  - RowsReturnedRate: 6.979K /sec       # RowsReturned/ActiveTime
  - TabletCount : 20                    # 该 ScanNode 涉及的 Tablet 数量。
  - TotalReadThroughput: 74.70 KB/sec   # BytesRead除以该节点运行的总时间（从Open到Close），对于IO受限的查询，接近磁盘的总吞吐量。
  - ScannerBatchWaitTime: 426.886us     # 用于统计transfer 线程等待scaner 线程返回rowbatch的时间。
  - ScannerWorkerWaitTime: 17.745us     # 用于统计scanner thread 等待线程池中可用工作线程的时间。
  OlapScanner:
    - BlockConvertTime: 8.941us         # 将向量化Block转换为行结构的 RowBlock 的耗时。向量化 Block 在 V1 中为 VectorizedRowBatch，V2中为 RowBlockV2。
    - BlockFetchTime: 468.974us         # Rowset Reader 获取 Block 的时间。
    - ReaderInitTime: 5.475ms           # OlapScanner 初始化 Reader 的时间。V1 中包括组建 MergeHeap 的时间。V2 中包括生成各级 Iterator 并读取第一组Block的时间。
    - RowsDelFiltered: 0                # 包括根据 Tablet 中存在的 Delete 信息过滤掉的行数，以及 unique key 模型下对被标记的删除行过滤的行数。
    - RowsPushedCondFiltered: 0         # 根据传递下推的谓词过滤掉的条件，比如 Join 计算中从 BuildTable 传递给 ProbeTable 的条件。该数值不准确，因为如果过滤效果差，就不再过滤了。
    - ScanTime: 39.24us                 # 从 ScanNode 返回给上层节点的时间。
    - ShowHintsTime_V1: 0ns             # V2 中无意义。V1 中读取部分数据来进行 ScanRange 的切分。
    SegmentIterator:
      - BitmapIndexFilterTimer: 779ns   # 利用 bitmap 索引过滤数据的耗时。
      - BlockLoadTime: 415.925us        # SegmentReader(V1) 或 SegmentIterator(V2) 获取 block 的时间。
      - BlockSeekCount: 12              # 读取 Segment 时进行 block seek 的次数。
      - BlockSeekTime: 222.556us        # 读取 Segment 时进行 block seek 的耗时。
      - BlocksLoad: 6                   # 读取 Block 的数量
      - CachedPagesNum: 30              # 仅 V2 中，当开启 PageCache 后，命中 Cache 的 Page 数量。
      - CompressedBytesRead: 0.00       # V1 中，从文件中读取的解压前的数据大小。V2 中，读取到的没有命中 PageCache 的 Page 的压缩前的大小。
      - DecompressorTimer: 0ns          # 数据解压耗时。
      - IOTimer: 0ns                    # 实际从操作系统读取数据的 IO 时间。
      - IndexLoadTime_V1: 0ns           # 仅 V1 中，读取 Index Stream 的耗时。
      - NumSegmentFiltered: 0           # 在生成 Segment Iterator 时，通过列统计信息和查询条件，完全过滤掉的 Segment 数量。
      - NumSegmentTotal: 6              # 查询涉及的所有 Segment 数量。
      - RawRowsRead: 7                  # 存储引擎中读取的原始行数。详情见下文。
      - RowsBitmapIndexFiltered: 0      # 仅 V2 中，通过 Bitmap 索引过滤掉的行数。
      - RowsBloomFilterFiltered: 0      # 仅 V2 中，通过 BloomFilter 索引过滤掉的行数。
      - RowsKeyRangeFiltered: 0         # 仅 V2 中，通过 SortkeyIndex 索引过滤掉的行数。
      - RowsStatsFiltered: 0            # V2 中，通过 ZoneMap 索引过滤掉的行数，包含删除条件。V1 中还包含通过 BloomFilter 过滤掉的行数。
      - RowsConditionsFiltered: 0       # 仅 V2 中，通过各种列索引过滤掉的行数。
      - RowsVectorPredFiltered: 0       # 通过向量化条件过滤操作过滤掉的行数。
      - TotalPagesNum: 30               # 仅 V2 中，读取的总 Page 数量。
      - UncompressedBytesRead: 0.00     # V1 中为读取的数据文件解压后的大小（如果文件无需解压，则直接统计文件大小）。V2 中，仅统计未命中 PageCache 的 Page 解压后的大小（如果Page无需解压，直接统计Page大小）
      - VectorPredEvalTime: 0ns         # 向量化条件过滤操作的耗时。
      - ShortPredEvalTime: 0ns          # 短路谓词过滤操作的耗时。
      - PredColumnReadTime: 0ns         # 谓词列读取的耗时。
      - LazyReadTime: 0ns               # 非谓词列读取的耗时。
      - OutputColumnTime: 0ns           # 物化列的耗时。
```

通过 Profile 中数据行数相关指标可以推断谓词条件下推和索引使用情况。以下仅针对 Segment V2 格式数据读取流程中的 Profile 进行说明。Segment V1 格式中，这些指标的含义略有不同。

  - 当读取一个 V2 格式的 Segment 时，若查询存在 key_ranges（前缀key组成的查询范围），首先通过 SortkeyIndex 索引过滤数据，过滤的行数记录在 `RowsKeyRangeFiltered`。
  - 之后，对查询条件中含有 bitmap 索引的列，使用 Bitmap 索引进行精确过滤，过滤的行数记录在 `RowsBitmapIndexFiltered`。
  - 之后，按查询条件中的等值（eq，in，is）条件，使用BloomFilter索引过滤数据，记录在 `RowsBloomFilterFiltered`。`RowsBloomFilterFiltered` 的值是 Segment 的总行数（而不是Bitmap索引过滤后的行数）和经过 BloomFilter 过滤后剩余行数的差值，因此 BloomFilter 过滤的数据可能会和 Bitmap 过滤的数据有重叠。
  - 之后，按查询条件和删除条件，使用 ZoneMap 索引过滤数据，记录在 `RowsStatsFiltered`。
  - `RowsConditionsFiltered` 是各种索引过滤的行数，包含了 `RowsBloomFilterFiltered` 和 `RowsStatsFiltered` 的值。
  - 至此 Init 阶段完成，Next 阶段删除条件过滤的行数，记录在 `RowsDelFiltered`。因此删除条件实际过滤的行数，分别记录在 `RowsStatsFiltered` 和 `RowsDelFiltered` 中。
  - `RawRowsRead` 是经过上述过滤后，最终需要读取的行数。
  - `RowsRead` 是最终返回给 Scanner 的行数。`RowsRead` 通常小于 `RawRowsRead`，是因为从存储引擎返回到 Scanner，可能会经过一次数据聚合。如果 `RawRowsRead` 和 `RowsRead` 差距较大，则说明大量的行被聚合，而聚合可能比较耗时。
  - `RowsReturned` 是 ScanNode 最终返回给上层节点的行数。`RowsReturned` 通常也会小于`RowsRead`。因为在 Scanner 上会有一些没有下推给存储引擎的谓词条件，会进行一次过滤。如果 `RowsRead` 和 `RowsReturned` 差距较大，则说明很多行在 Scanner 中进行了过滤。这说明很多选择度高的谓词条件并没有推送给存储引擎。而在 Scanner 中的过滤效率会比在存储引擎中过滤效率差。

通过以上指标，可以大致分析出存储引擎处理的行数以及最终过滤后的结果行数大小。通过 `Rows***Filtered` 这组指标，也可以分析查询条件是否下推到了存储引擎，以及不同索引的过滤效果。此外还可以通过以下几个方面进行简单的分析。
    

  - `OlapScanner` 下的很多指标，如 `IOTimer`，`BlockFetchTime` 等都是所有 Scanner 线程指标的累加，因此数值可能会比较大。并且因为 Scanner 线程是异步读取数据的，所以这些累加指标只能反映 Scanner 累加的工作时间，并不直接代表 ScanNode 的耗时。ScanNode 在整个查询计划中的耗时占比为 `Active` 字段记录的值。有时会出现比如 `IOTimer` 有几十秒，而 `Active` 实际只有几秒钟。这种情况通常因为：
    - `IOTimer` 为多个 Scanner 的累加时间，而 Scanner 数量较多。
    - 上层节点比较耗时。比如上层节点耗时 100秒，而底层 ScanNode 只需 10秒。则反映在 `Active` 的字段可能只有几毫秒。因为在上层处理数据的同时，ScanNode 已经异步的进行了数据扫描并准备好了数据。当上层节点从 ScanNode 获取数据时，可以获取到已经准备好的数据，因此 Active 时间很短。
  - `NumScanners` 表示 Scanner 提交到线程池的Task个数，由 `RuntimeState` 中的线程池调度，`doris_scanner_thread_pool_thread_num` 和 `doris_scanner_thread_pool_queue_size` 两个参数分别控制线程池的大小和队列长度。线程数过多或过少都会影响查询效率。同时可以用一些汇总指标除以线程数来大致的估算每个线程的耗时。
  - `TabletCount` 表示需要扫描的 tablet 数量。数量过多可能意味着需要大量的随机读取和数据合并操作。
  - `UncompressedBytesRead` 间接反映了读取的数据量。如果该数值较大，说明可能有大量的 IO 操作。
  - `CachedPagesNum` 和 `TotalPagesNum` 可以查看命中 PageCache 的情况。命中率越高，说明 IO 和解压操作耗时越少。

#### `Buffer pool`

 - AllocTime: 内存分配耗时
 - CumulativeAllocationBytes: 累计内存分配的量
 - CumulativeAllocations: 累计的内存分配次数
 - PeakReservation: Reservation的峰值
 - PeakUnpinnedBytes: unpin的内存数据量
 - PeakUsedReservation: Reservation的内存使用量
 - ReservationLimit: BufferPool的Reservation的限制量
