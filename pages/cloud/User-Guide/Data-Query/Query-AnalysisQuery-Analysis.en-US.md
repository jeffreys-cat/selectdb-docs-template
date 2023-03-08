# Query Analysis

SelectDB provides a graphical command to help users analyze a specific query or import more conveniently. This article describes how to use this feature.

## Query plan tree

SQL is a descriptive language, and users describe the data they want to obtain through a SQL. The specific execution method of a SQL depends on the implementation of the database. The query planner is used to determine how the database specifically executes a SQL.

For example, if the user specifies a Join operator, the query planner needs to decide the specific Join algorithm, such as Hash Join or Merge Sort Join; whether to use Shuffle or Broadcast; whether the Join order needs to be adjusted to avoid Cartesian products; and determine the final Which nodes are executed and so on.

The query planning process of SelectDB is to first convert a SQL statement into a stand-alone execution plan tree.

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



After that, the query planner converts the stand-alone query plan into a distributed query plan according to the specific operator execution mode and the specific distribution of data. The distributed query plan is composed of multiple Fragments, and each Fragment is responsible for a part of the query plan, and the ExchangeNode operators are used to transmit data between each Fragment.

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



As shown above, we divided the stand-alone plan into two Fragments: F1 and F2. Data is transmitted between two Fragments through an ExchangeNode node.

And a Fragment will be further divided into multiple Instances. Instance is the final concrete execution instance. Dividing into multiple Instances helps to make full use of machine resources and improve the execution concurrency of a Fragment.

## View query plan

You can view an SQL execution plan through the following three commands.

- `EXPLAIN GRAPH select ...;`or`DESC GRAPH select ...;`
- `EXPLAIN select ...;`
- `EXPLAIN VERBOSE select ...;`

The first command displays a query plan in a graphical manner. This command can intuitively display the tree structure of the query plan and the division of Fragments:

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

As can be seen from the figure, the query plan tree is divided into five Fragments: 0, 1, 2, 3, and 4. For example, on a `OlapScanNode`node `[Fragment: 0]`indicates that this node belongs to Fragment 0. Data transmission is performed between each Fragment through DataStreamSink and ExchangeNode.

Graphical commands only display simplified node information. If you need to view more specific node information, such as the filter conditions pushed to the node as follows, you need to view more detailed text version information through the second command:

```text
mysql> explain select tbl1.k1, sum(tbl1.k2) from tbl1 join tbl2 on tbl1.k1 = tbl2.k1 group by tbl1.k1 order by tbl1.k1;
+----------------------------------------------------------------------------------+
| Explain String                                                                   |
+----------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                  |
|  OUTPUT EXPRS:<slot 5> <slot 3> `tbl1`.`k1` | <slot 6> <slot 4> sum(`tbl1`.`k2`) |
|   PARTITION: UNPARTITIONED                                                       
|   RESULT SINK                                                                    
|   9:MERGING-EXCHANGE                                                             
|      limit: 65535                                                                                                                                               |
| PLAN FRAGMENT 1                                                                  
|  OUTPUT EXPRS:                                                                   
|   PARTITION: HASH_PARTITIONED: <slot 3> `tbl1`.`k1`                              |                                                                                 
|   STREAM DATA SINK                                                               
|     EXCHANGE ID: 09                                                              
|     UNPARTITIONED                                                                                                                                                |
|   4:TOP-N                                                                        
|   |  order by: <slot 5> <slot 3> `tbl1`.`k1` ASC                                 
|   |  offset: 0                                                                   
|   |  limit: 65535                                                                
|   |                                                                              |
|   8:AGGREGATE (merge finalize)                                                   
|   |  output: sum(<slot 4> sum(`tbl1`.`k2`))                                      
|   |  group by: <slot 3> `tbl1`.`k1`                                              
|   |  cardinality=-1                                                              
|   |                                                                              
|   7:EXCHANGE                                                                                                                                                       |
| PLAN FRAGMENT 2                                                                  
|  OUTPUT EXPRS:                                                                   
|   PARTITION: HASH_PARTITIONED: `tbl1`.`k1`                                                                                                                       |
|   STREAM DATA SINK                                                               
|     EXCHANGE ID: 07                                                              
|     HASH_PARTITIONED: <slot 3> `tbl1`.`k1`                                                                                                                        |
|   3:AGGREGATE (update serialize)                                                 
|   |  STREAMING                                                                   
|   |  output: sum(`tbl1`.`k2`)                                                    
|   |  group by: `tbl1`.`k1`                                                       
|   |  cardinality=-1                                                              
|   |                                                                              |
|   2:HASH JOIN                                                                    
|   |  join op: INNER JOIN (PARTITIONED)                                           
|   |  runtime filter: false                                                       
|   |  hash predicates:                                                            
|   |  colocate: false, reason: table not in the same group                        
|   |  equal join conjunct: `tbl1`.`k1` = `tbl2`.`k1`                              
|   |  cardinality=2                                                               
|   |                                                                              
|   |----6:EXCHANGE                                                                
|   |                                                                              
|   5:EXCHANGE                                                                                                                                                      |
| PLAN FRAGMENT 3                                                                  
|  OUTPUT EXPRS:                                                                   
|   PARTITION: RANDOM                                                                                                                                             |
|   STREAM DATA SINK                                                               
|     EXCHANGE ID: 06                                                              
|     HASH_PARTITIONED: `tbl2`.`k1`                                                
|                                                                               |
|   1:OlapScanNode                                                                 
|      TABLE: tbl2                                                                 
|      PREAGGREGATION: ON                                                          
|      partitions=1/1                                                              
|      rollup: tbl2                                                                |      tabletRatio=3/3                                                             
|      tabletList=105104776,105104780,105104784                                    
|      cardinality=1                                                               
|      avgRowSize=4.0                                                              
|      numNodes=6                                                                  
|                                                                                  |
| PLAN FRAGMENT 4                                                                  
|  OUTPUT EXPRS:                                                                   
|   PARTITION: RANDOM                                                                                                                                                |
|   STREAM DATA SINK                                                               
|     EXCHANGE ID: 05                                                              
|     HASH_PARTITIONED: `tbl1`.`k1`                                                
|                                                                                 |
|   0:OlapScanNode                                                                 
|      TABLE: tbl1                                                                 
|      PREAGGREGATION: ON                                                          
|      partitions=1/1                                                              
|      rollup: tbl1                                                                
|      tabletRatio=3/3                                                             
|      tabletList=105104752,105104763,105104767                                    
|      cardinality=2                                                               
|      avgRowSize=8.0                                                              
|      numNodes=6                                                                  |
+----------------------------------------------------------------------------------+
```

The third `EXPLAIN VERBOSE select ...;`command can view more detailed execution plan information than the second command.

```text
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



> The information displayed in the query plan is still being standardized and improved, and we will introduce it in detail in subsequent articles.

## View query profile

Users can turn on session variables with the following command `is_report_success`:

```sql
SET is_report_success=true;
```

Then execute the query, and Doris will generate a Profile of the query. Profile contains a query about the specific execution of each node, which helps us analyze query bottlenecks.

After executing the query, we can first obtain the Profile list through the following command:

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

This command will list all currently saved profiles. Each row corresponds to a query. We can select the QueryId corresponding to the Profile we want to see to see the specific situation.

Viewing a Profile is divided into 3 steps:

1. View the overall execution plan tree

   This step is mainly used to analyze the execution plan as a whole and check the execution time of each Fragment.

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

   

   As shown in the figure above, each node marks the Fragment it belongs to, and marks the execution time of the Fragment in the Sender node of each Fragment. This time-consuming is the longest one among all Instance execution times under Fragment. This helps us find the most time-consuming Fragment from an overall perspective.

2. View the Instance list under the specific Fragment

   For example, if we find that Fragment 1 takes the longest time, we can continue to view the Instance list of Fragment 1:

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

   

   This shows the execution nodes and time-consuming of all 3 Instances on Fragment 1.

3. View the specific Instance

   We can continue to view the detailed profile of each operator on a specific Instance:

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

   

   The figure above shows the specific profiles of each operator of Instance c257c52f93e149ee-ace8ac14e8c9ff03 in Fragment 1.

Through the above three steps, we can gradually troubleshoot a SQL performance bottleneck.

## Profile parameter analysis

The BE side collects a lot of statistical information, and the corresponding meanings of each parameter are listed below:

#### `Fragment`

- AverageThreadTokens: The number of threads used to execute the Fragment, excluding the usage of the thread pool
- Buffer Pool PeakReservation: The peak value of memory used by Buffer Pool
- MemoryLimit: The memory limit when querying
- PeakMemoryUsage: The peak memory usage of the entire Instance during query
- RowsProduced: the number of rows produced by the column

#### `BlockMgr`

- BlocksCreated: the number of Blocks created by BlockMgr
- BlocksRecycled: Number of Blocks reused
- BytesWritten: The total amount of data written to the disk
- MaxBlockSize: the size of a single Block
- TotalReadBlockTime: Total time spent reading Block

#### `DataStreamSender`

- BytesSent: The total amount of data sent = recipient * amount of data sent
- IgnoreRows: the number of rows filtered
- LocalBytesSent: During the process of data exchange, record the amount of data sent and received by the local node
- OverallThroughput: total throughput = BytesSent / time
- SerializeBatchTime: Time spent serializing sending data
- UncompressedRowBatchSize: The size of RowBatch before sending data compression

#### `ODBC_TABLE_SINK`

- NumSentRows: The total number of rows written to the foreign table
- TupleConvertTime: The time it takes to serialize the sent data into an Insert statement
- ResultSendTime: Time-consuming to write through ODBC Driver

#### `EXCHANGE_NODE`

- BytesReceived: the amount of data received over the network
- MergeGetNext: When there is sorting in the lower layer nodes, a unified merge sorting will be performed on the EXCHANGE NODE, and the sorted results will be output. This indicator records the total time spent on Merge sorting, including the time spent on MergeGetNextBatch.
- MergeGetNextBatch: the time it takes for the Merge node to fetch data. If it is a single-layer Merge sort, the object to fetch data is the network queue. For multi-layer Merge sorting, the data object is Child Merger.
- ChildMergeGetNext: When there are too many Senders sending data in the lower layer, single-threaded Merge will become a performance bottleneck, and Doris will start multiple Child Merge threads to merge and sort in parallel. It is recorded that the sorting time of Child Merge is the cumulative value of multiple threads.
- ChildMergeGetNextBatch: Time-consuming for the Child Merge node to fetch data. If the time-consuming is too long, the possible bottleneck is the lower-layer data sending node.
- DataArrivalWaitTime: Total time waiting for Sender to send data
- FirstBatchArrivalWaitTime: The time to wait for the first batch to be obtained from Sender
- DeserializeRowBatchTimer: Time-consuming deserialization of network data
- SendersBlockedTotalTimer(*): The memory of the DataStreamRecv queue is full, and the waiting time of the Sender end
- ConvertRowBatchTime: Time-consuming to convert received data into RowBatch
- RowsReturned: the number of rows received
- RowsReturnedRate: The rate at which rows are received

#### `SORT_NODE`

- InMemorySortTime: Time-consuming sorting in memory
- InitialRunsCreated: The number of times to initialize the sorting (if the memory is sorted, the number is 1)
- SortDataSize: The total amount of sorted data
- MergeGetNext: MergeSort takes time to get the next batch from multiple sort_runs (only timed when the disk is placed)
- MergeGetNextBatch: Time-consuming for MergeSort to extract the next sort_run batch (timing only when placing the disk)
- TotalMergesPerformed: The number of times the efflux merge was performed

#### `AGGREGATION_NODE`

- PartitionsCreated: The number of Partitions that the aggregation query is split into
- GetResultsTime: The time to get aggregated results from each partition
- HTResizeTime: The time consumed by HashTable resize
- HTResize: HashTable resize times
- HashBuckets: the number of Buckets in the HashTable
- HashBucketsWithDuplicate: HashTable has the number of Buckets of DuplicateNode
- HashCollisions: The number of hash collisions generated by HashTable
- HashDuplicateNodes: The number of DuplicateNodes with the same Buckets in HashTable
- HashFailedProbe: The number of failed HashTable Probe operations
- HashFilledBuckets: Number of Buckets filled with data in HashTable
- HashProbe: The number of HashTable queries
- HashTravelLength: The number of steps moved when HashTable query

#### `HASH_JOIN_NODE`

- ExecOption: The way to construct HashTable for the right child (synchronous or asynchronous), the right child in Join may be a table or subquery, and the left child is the same
- BuildBuckets: the number of Buckets in the HashTable
- BuildRows: the number of rows of HashTable
- BuildTime: Time-consuming to construct HashTable
- LoadFactor: The load factor of HashTable (that is, the number of non-empty Buckets)
- ProbeRows: Traversing the number of rows for Hash Probe on the left child
- ProbeTime: The time spent traversing the left child for Hash Probe, excluding the time spent calling GetNext on the left child RowBatch
- PushDownComputeTime: Time-consuming calculation of predicate pushdown conditions
- PushDownTime: The total time-consuming of predicate pushdown. When joining, the right child that meets the requirements is converted to the in query of the left child.

#### `CROSS_JOIN_NODE`

- ExecOption: The way to construct RowBatchList for the right child (synchronous or asynchronous)
- BuildRows: the number of rows of RowBatchList (that is, the number of rows of the right child)
- BuildTime: Time-consuming construction of RowBatchList
- LeftChildRows: the number of rows of the left child
- LeftChildTime: The time spent traversing the left child and finding the Cartesian product with the right child, excluding the time spent calling GetNext on the left child RowBatch

#### `UNION_NODE`

- MaterializeExprsEvaluateTime: When the field types at both ends of the Union are inconsistent, the time-consuming calculation of the type conversion expression and the materialization result

#### `ANALYTIC_EVAL_NODE`

- EvaluationTime: The total calculation time of the analysis function (window function)
- GetNewBlockTime: Time-consuming to apply for a new Block during initialization. The Block is used to cache the Rows window or the entire partition for analyzing function calculations
- PinTime: the time it takes to apply for a new block or reread the block written to the disk back into the memory
- UnpinTime: Time-consuming to flush the data of the block to the disk when the memory pressure of the block that is not needed temporarily or the current operator is high

#### `OLAP_SCAN_NODE`

`OLAP_SCAN_NODE`Nodes are responsible for specific data scanning tasks. A `OLAP_SCAN_NODE`will generate one or more `OlapScanner`. Each Scanner thread is responsible for scanning part of the data.

Some or all of the predicate conditions in the query are pushed to `OLAP_SCAN_NODE`. Some of these predicate conditions will continue to be pushed down to the storage engine so that the indexes of the storage engine can be used for data filtering. The other part is kept `OLAP_SCAN_NODE`in and is used to filter the data returned from the storage engine.

`OLAP_SCAN_NODE`The profile of a node is usually used to analyze the efficiency of data scanning, and is divided into three layers according to the `OLAP_SCAN_NODE`calling `OlapScanner`relationship `SegmentIterator`.

The profile of a typical `OLAP_SCAN_NODE`node is as follows. Some indicators have different meanings due to different storage formats (V1 or V2).

```text
OLAP_SCAN_NODE (id=0):(Active: 1.2ms, % non-child: 0.00%)
	 - BytesRead: 265.00 B # The amount of data read from the data file. Assuming that 10 32-bit integers are read, the data volume is 10 * 4B = 40 Bytes. This data only represents the size of the data fully expanded in memory, and does not represent the actual IO size.
   - NumDiskAccess: 1 # The number of disks involved in the ScanNode node.
   - NumScanners: 20 # The number of Scanners generated by this ScanNode.
   - PeakMemoryUsage: 0.00 # The peak value of memory usage when querying, not used yet
   - RowsRead: 7 # The number of rows returned from the storage engine to Scanner, excluding the number of rows filtered by Scanner.
   - RowsReturned: 7 # The number of rows returned from ScanNode to the upper node.
   - RowsReturnedRate: 6.979K /sec # RowsReturned/ActiveTime
   - TabletCount: 20 # The number of tablets involved in this ScanNode.
   - TotalReadThroughput: 74.70 KB/sec # BytesRead divided by the total running time of the node (from Open to Close), for IO-limited queries, close to the total throughput of the disk.
   - ScannerBatchWaitTime: 426.886us # Used to count the time the transfer thread waits for the scanner thread to return rowbatch.
   - ScannerWorkerWaitTime: 17.745us # Used to count the time the scanner thread waits for available worker threads in the thread pool.
   OlapScanner:
     - BlockConvertTime: 8.941us # Time-consuming to convert vectorized Block to row-structured RowBlock. Vectorized Block is VectorizedRowBatch in V1 and RowBlockV2 in V2.
     - BlockFetchTime: 468.974us # The time when Rowset Reader gets the Block.
     - ReaderInitTime: 5.475ms # Time for OlapScanner to initialize Reader. V1 includes the time to build MergeHeap. V2 includes the time to generate all levels of Iterator and read the first set of Blocks.
     - RowsDelFiltered: 0 #Includes the number of rows filtered out based on the Delete information in the Tablet, and the number of rows filtered for marked deleted rows under the unique key model.
     - RowsPushedCondFiltered: 0 # Conditions filtered out according to the predicate passed down, such as the conditions passed from BuildTable to ProbeTable in Join calculation. This number is inaccurate because if the filter is poor, it is no longer filtered.
     - ScanTime: 39.24us # Return time from ScanNode to upper node.
     - ShowHintsTime_V1: 0ns # Meaningless in V2. Part of the data is read in V1 to perform ScanRange segmentation.
     SegmentIterator:
       - BitmapIndexFilterTimer: 779ns # Time-consuming to filter data using bitmap index.
       - BlockLoadTime: 415.925us # The time for SegmentReader(V1) or SegmentIterator(V2) to get the block.
       - BlockSeekCount: 12 # The number of block seeks when reading the Segment.
       - BlockSeekTime: 222.556us # Time-consuming block seek when reading Segment.
       - BlocksLoad: 6 # The number of blocks to read
       - CachedPagesNum: 30 # Only in V2, when PageCache is enabled, the number of Pages that hit the Cache.
       - CompressedBytesRead: 0.00 # In V1, the size of the data read from the file before decompression. In V2, the uncompressed size of the read Page that does not hit the PageCache.
       - DecompressorTimer: 0ns # Data decompression time-consuming.
       - IOTimer: 0ns # The actual IO time for reading data from the operating system.
       - IndexLoadTime_V1: 0ns # Time-consuming to read Index Stream only in V1.
       - NumSegmentFiltered: 0 # When generating a Segment Iterator, the number of Segments that are completely filtered out through column statistics and query conditions.
       - NumSegmentTotal: 6 # The number of all segments involved in the query.
       - RawRowsRead: 7 # The number of raw rows read in the storage engine. See below for details.
       - RowsBitmapIndexFiltered: 0 # Only in V2, the number of rows filtered through the Bitmap index.
       - RowsBloomFilterFiltered: 0 # Only in V2, the number of rows filtered by the BloomFilter index.
       - RowsKeyRangeFiltered: 0 # Only in V2, the number of rows filtered by the SortkeyIndex index.
       - RowsStatsFiltered: 0 # In V2, the number of rows filtered through the ZoneMap index, including deletion conditions. V1 also contains the number of rows filtered out by the BloomFilter.
       - RowsConditionsFiltered: 0 # Only in V2, the number of rows filtered by various column indexes.
       - RowsVectorPredFiltered: 0 # The number of rows filtered by the vectorized condition filter operation.
       - TotalPagesNum: 30 # Only in V2, the total number of Pages read.
       - UncompressedBytesRead: 0.00 # In V1, it is the decompressed size of the read data file (if the file does not need to be decompressed, the file size will be counted directly). In V2, only the decompressed size of the Page that misses the PageCache is counted (if the Page does not need to be decompressed, the Page size is counted directly)
       - VectorPredEvalTime: 0ns # Time-consuming vectorization condition filtering operation.
       - ShortPredEvalTime: 0ns # Time-consuming of the short-circuit predicate filtering operation.
       - PredColumnReadTime: 0ns # Time-consuming predicate column read.
       - LazyReadTime: 0ns # Time-consuming to read non-predicate columns.
       - OutputColumnTime: 0ns # Time-consuming for materializing columns.
```



The predicate condition pushdown and index usage can be inferred through the data row number related indicators in the Profile. The following describes only the Profile in the Segment V2 format data reading process. In the Segment V1 format, the meaning of these metrics is slightly different.

- When reading a Segment in V2 format, if there are key_ranges (query ranges composed of prefix keys) in the query, first filter the data through the SortkeyIndex index, and record the number of rows filtered `RowsKeyRangeFiltered`.
- After that, use the Bitmap index to perform precise filtering on the columns containing the bitmap index in the query condition, and record the number of rows filtered `RowsBitmapIndexFiltered`.
- After that, according to the equivalent (eq, in, is) conditions in the query conditions, use the BloomFilter index to filter the data, recorded in `RowsBloomFilterFiltered`. `RowsBloomFilterFiltered`The value of is the difference between the total number of rows of Segment (not the number of rows filtered by Bitmap index) and the number of remaining rows after filtering by BloomFilter, so the data filtered by BloomFilter may overlap with the data filtered by Bitmap.
- Afterwards, according to the query conditions and deletion conditions, the ZoneMap index is used to filter the data, which is recorded in `RowsStatsFiltered`.
- `RowsConditionsFiltered`is the number of rows filtered by various indexes, including `RowsBloomFilterFiltered`the `RowsStatsFiltered`values of and .
- So far, the Init stage is completed, and the number of rows filtered by the condition is deleted in the Next stage, which is recorded in `RowsDelFiltered`. Therefore, the number of rows actually filtered by the deletion condition is recorded in `RowsStatsFiltered`and `RowsDelFiltered`.
- `RawRowsRead`It is the number of rows that need to be read after the above filtering.
- `RowsRead`is the number of rows that will eventually be returned to the Scanner. `RowsRead`Usually less than `RawRowsRead`that, because it may go through a data aggregation from the storage engine back to the Scanner. `RawRowsRead`If `RowsRead`the difference between and is large, it means that a large number of rows are aggregated, and the aggregation may be time-consuming.
- `RowsReturned`It is the number of rows that ScanNode finally returns to the upper node. `RowsReturned`Usually less than `RowsRead`. Because there will be some predicate conditions on the Scanner that are not pushed down to the storage engine, a filter will be performed. `RowsRead`If `RowsReturned`there is a large difference between and , many rows were filtered in the Scanner. This shows that many predicate conditions with high selectivity are not pushed to the storage engine. However, the filtering efficiency in the Scanner will be worse than that in the storage engine.

Through the above indicators, you can roughly analyze the number of rows processed by the storage engine and the number of rows in the final filtered result. Through `Rows***Filtered`this set of indicators, you can also analyze whether the query conditions are pushed down to the storage engine, and the filtering effects of different indexes. In addition, simple analysis can be carried out through the following aspects.

- `OlapScanner` has indicators, such as `IOTimer`, `BlockFetchTime` etc. are the accumulation of all Scanner thread indicators, so the values may be relatively large. And because the Scanner thread reads data asynchronously, these accumulated indicators can only reflect the accumulated working time of the Scanner, and do not directly represent the time-consuming of the ScanNode. The time-consuming ratio of ScanNode in the entire query plan is the value recorded in the `Active` field. Sometimes it appears `IOTimer` that there are tens of seconds, but `Active` actually only a few seconds. This usually happens because of:
  - `IOTimer`It is the accumulative time of multiple Scanners, and the number of Scanners is large.
  - The upper node is more time-consuming. For example, the upper node takes 100 seconds, but the bottom ScanNode only takes 10 seconds. Then `Active`the field reflected in the may only have a few milliseconds. Because while the upper layer is processing the data, the ScanNode has already scanned the data asynchronously and prepared the data. When the upper node obtains data from ScanNode, it can obtain the prepared data, so the Active time is very short.

- `NumScanners`Indicates the number of Tasks submitted by the Scanner to the thread pool, which `RuntimeState`is scheduled by the thread pool in and`doris_scanner_thread_pool_thread_num` controls the size of the thread pool and the queue length respectively. `doris_scanner_thread_pool_queue_size`Too many or too few threads will affect query efficiency. At the same time, some summary indicators can be divided by the number of threads to roughly estimate the time-consuming of each thread.

- `TabletCount`Indicates the number of tablets to scan. Too many can mean a lot of random read and data merge operations.

- `UncompressedBytesRead`Indirectly reflects the amount of data read. If the value is large, it means that there may be a large number of IO operations.

- `CachedPagesNum`and `TotalPagesNum`can view the hits to PageCache. The higher the hit rate, the less time-consuming IO and decompression operations are.

#### `Buffer pool`

- AllocTime: memory allocation time-consuming
- CumulativeAllocationBytes: The amount of cumulative memory allocation
- CumulativeAllocations: the cumulative number of memory allocations
- PeakReservation: Peak Reservation
- PeakUnpinnedBytes: the amount of unpinned memory data
- PeakUsedReservation: Memory usage of Reservation
- ReservationLimit: Reservation limit of BufferPool