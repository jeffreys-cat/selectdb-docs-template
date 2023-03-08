# Variable Settings

This document mainly introduces the currently supported variables.

Variables in SelectDB refer to variable settings in MySQL. However, some variables are only used to be compatible with some MySQL client protocols, and do not have their actual meaning in the MySQL database.

## Show and set variables

### Show

You can `SHOW VARIABLES [LIKE 'xxx'];`view all or specific variables with . like:

```sql
SHOW VARIABLES;
SHOW VARIABLES LIKE '%time_zone%';
```

### Set

Some variables can be set to take effect globally or only in the current session.

After the setting takes effect globally, the setting value will be used in subsequent new session connections, and the value in the current session will also change.

Only the current session takes effect, set by the `SET var_name=xxx;`statement . like:

```sql
SET exec_mem_limit = 137438953472;
SET forward_to_master = true;
SET time_zone = "Asia/Shanghai";
```

It takes effect globally and is `SET GLOBAL var_name=xxx;`set . like:

```sql
SET GLOBAL exec_mem_limit = 137438953472
```

> Note: Only ADMIN users can set variables to take effect globally.

Variables that support both the current session and global validation include:

- `time_zone`
- `wait_timeout`
- `sql_mode`
- `enable_profile`
- `query_timeout`
- `exec_mem_limit`
- `batch_size`
- `allow_partition_column_nullable`
- `insert_visible_timeout_ms`
- `enable_fold_constant_by_be`

Variables that only support global effects include:

- `default_rowset_type`
- `default_password_lifetime`
- `password_history`
- `validate_password_policy`

At the same time, variable settings also support constant expressions. like:

```sql
SET exec_mem_limit = 10 * 1024 * 1024 * 1024;
SET forward_to_master = concat('tr', 'u', 'e');
```

### Setting variables through query hint

In some cases, we may need to set variables specifically for certain queries. Session variables can be set within a query (with effect within a single statement) by using the SET_VAR hint. example:

```sql
SELECT /*+ SET_VAR(exec_mem_limit = 8589934592) */ name FROM people ORDER BY name;
SELECT /*+ SET_VAR(query_timeout = 1, enable_partition_cache=true) */ sleep(3);
```

Note that comments must start with /*+ and can only follow SELECT.

## Supported variables

- `SQL_AUTO_IS_NULL`

  Compatible with JDBC connection pool C3P0. No practical effect.

- `auto_increment_increment`

  For compatibility with MySQL clients. No practical effect.

- `autocommit`

  For compatibility with MySQL clients. No practical effect.

- `auto_broadcast_join_threshold`

  The maximum size in bytes of the table that will be broadcast to all nodes when performing a join, broadcasting can be disabled by setting this value to -1.

  The system provides two ways to implement Join, `broadcast join`and `shuffle join`.

  `broadcast join`It means that after the small table is conditionally filtered, it is broadcast to each node where the large table is located to form a memory Hash table, and then the data of the large table is read out in a streaming manner for Hash Join.

  `shuffle join`It refers to Hash both the small table and the large table according to the Join key, and then perform distributed Join.

  When the amount of data in a small table is small, it `broadcast join`has better performance. On the contrary, shuffle join has better performance.

  The system will automatically try to perform Broadcast Join, or you can explicitly specify the implementation method of each join operator. The system provides configurable parameters `auto_broadcast_join_threshold`, `broadcast join`specifying the upper limit of the ratio of the memory used by the hash table to the overall execution memory when using , the value ranges from 0 to 1, and the default value is 0.8. When the memory used by the system to calculate the hash table exceeds this limit, it will be automatically converted to use`shuffle join`

  The overall execution memory here is: a proportion of the query optimizer's estimation

  > Note: It is not recommended to use this parameter to adjust. If you must use a certain type of join, it is recommended to use hint, such as join [shuffle]

- `batch_size`

  Used to specify the number of rows in a single packet transmitted by each node during query execution. The default number of lines in a data packet is 1024 lines, that is, after the source node generates 1024 lines of data, it will be packaged and sent to the destination node.

  A larger number of rows will improve query throughput when scanning a large amount of data, but may increase query latency in small query scenarios. At the same time, it will also increase the memory overhead of the query. The recommended setting range is 1024 to 4096.

- `character_set_client`

  For compatibility with MySQL clients. No practical effect.

- `character_set_connection`

  For compatibility with MySQL clients. No practical effect.

- `character_set_results`

  For compatibility with MySQL clients. No practical effect.

- `character_set_server`

  For compatibility with MySQL clients. No practical effect.

- `codegen_level`

  Used to set the level of the LLVM codegen. (not currently in effect).

- `collation_connection`

  For compatibility with MySQL clients. No practical effect.

- `collation_database`

  For compatibility with MySQL clients. No practical effect.

- `collation_server`

  For compatibility with MySQL clients. No practical effect.

- `delete_without_partition`

  When set to true. When using the delete command to delete partition table data, no partition can be specified. The delete operation will be automatically applied to all partitions.

  But note that automatically applying to all partitions may cause the delete command to take time and trigger a large number of subtasks, resulting in a long time-consuming. It is not recommended to enable it if it is not necessary.

- `disable_colocate_join`

  Controls whether to enable the Colocation Join (User Guide/Data Query/Distributed Join) . The default is false, which means the function is enabled. true means disable the feature. When this function is disabled, the query plan will not try to execute Colocation Join.

- `enable_bucket_shuffle_join`

  Controls whether to enable the Bucket Shuffle Join (User Guide/Data Query/Distributed Join) . The default is true, which means enable this function. false means disable the feature. When this function is disabled, the query plan will not attempt to perform Bucket Shuffle Join.

- `disable_streaming_preaggregations`

  Controls whether streaming pre-aggregation is enabled. The default is false, that is, enabled. Currently not configurable and enabled by default.

- `enable_insert_strict`

  It is used to set whether to open the `strict`mode . The default is false, that is, the `strict`mode . 

- `enable_spilling`

  It is used to set whether to enable the sorting of large data volume. The default is false, that is, this function is turned off. When the user does not specify the LIMIT condition of the ORDER BY clause and sets `enable_spilling`it to true at the same time, the order sorting will be enabled. After this function is enabled, the directory under the BE data `doris-scratch/`directory store temporary storage data, and the temporary data will be cleared after the query is completed.

  This function is mainly used for sorting operations with a large amount of data using limited memory.

  Note that this feature is experimental and does not guarantee stability, please enable it with caution.

- `exec_mem_limit`

  Used to set the memory limit for a single query. The default is 2GB, the unit is B/K/KB/M/MB/G/GB/T/TB/P/PB, and the default is B.

  This parameter is used to limit the memory that can be used by an instance of a single query plan in a query plan. A query plan may have multiple instances, and a BE node may execute one or more instances. Therefore, this parameter cannot accurately limit the memory usage of a query in the entire cluster, nor can it accurately limit the memory usage of a query on a single BE node. The details need to be judged according to the generated query plan.

  Usually, more memory is consumed only on some blocked nodes (such as sorting nodes, aggregation nodes, and join nodes), while in other nodes (such as scanning nodes), data is streamed and does not occupy more memory .

  When an `Memory Exceed Limit`error occurs, you can try to increase the parameter exponentially, such as 4G, 8G, 16G, etc.

- `init_connect`

  For compatibility with MySQL clients. No practical effect.

- `interactive_timeout`

  For compatibility with MySQL clients. No practical effect.

- `enable_profile`

  It is used to set whether to view the profile of the query. The default is false, that is, no profile is required.

  By default, only when an error occurs in the query, BE will send the profile to FE for checking the error. Queries that end normally do not send profiles. Sending a profile will generate a certain network overhead, which is not good for high-concurrency query scenarios. When the user wants to analyze a query profile, he can set this variable to true and send the query.

- `language`

  For compatibility with MySQL clients. No practical effect.

- `license`

  Display the License of SelectDB. No other effect.

- `lower_case_table_names`

  It is used to control whether the user table name is case-sensitive.

  When the value is 0, the table name is case sensitive. The default is 0.

  When the value is 1, the table name is case-insensitive, and doris will convert the table name to lowercase when storing and querying. The advantage is that any case of the table name can be used in a statement, and the following SQL is correct:

  ```sql
  mysql> show tables;  
  +------------------+
  | Tables_in_testdb |
  +------------------+
  | cost             |
  +------------------+
  
  mysql> select * from COST where COst.id < 100 order by cost.id;
  ```

  

  The disadvantage is that the table name specified in the table creation statement cannot be obtained after the table is built, and the table name to `show tables`be viewed is the lowercase of the specified table name.

  When the value is 2, the case of the table name is not sensitive, doris stores the table name specified in the table creation statement, and converts it to lowercase for comparison when querying. The advantage is that `show tables`the name of the table to be viewed is specified in the table creation statement; the disadvantage is that only one case of the table name can be used in the same statement, for example, to`cost` query using table name :`COST`

  ```sql
  mysql> select * from COST where COST.id < 100 order by COST.id;
  ```

  

  This variable is compatible with MySQL. It needs to `lower_case_table_names=`be initialized. After the cluster initialization is completed, `set`the variable cannot be modified through the statement, nor can it be modified by restarting or upgrading the cluster.

  The system view table name in information_schema is not case-sensitive, and when the `lower_case_table_names`value is 0, it is displayed as 2.

- `max_allowed_packet`

  Compatible with JDBC connection pool C3P0. No practical effect.

- `max_pushdown_conditions_per_column`

  It is used to limit the maximum number of conditions that can be pushed down to the storage engine for a single column in a query request. During the execution of the query plan, the filter conditions on some columns can be pushed down to the storage engine, so that the index information in the storage engine can be used for data filtering, reducing the amount of data that needs to be scanned by the query. Such as equality conditions, conditions in IN predicates, etc. This parameter affects only queries containing IN predicates in most cases. eg `WHERE colA IN (1,2,3,4,...)`. A larger value means that more conditions in the value IN predicate can be pushed to the storage engine, but too many conditions may lead to an increase in random reads, and in some cases may reduce query efficiency.

- `max_scan_key_num`

  It is used to limit the maximum number of scan keys that can be split by a scan node in a query request. When a query request with conditions arrives at the scan node, the scan node will try to split the conditions related to the key column in the query conditions into multiple scan key ranges. These scan key ranges will then be assigned to multiple scanner threads for data scanning. A larger value usually means that more scanner threads can be used to increase the parallelism of scanning operations. However, in high-concurrency scenarios, too many threads may bring greater scheduling overhead and system load, which will reduce query response speed. An experience value is 50.

- `net_buffer_length`

  For compatibility with MySQL clients. No practical effect.

- `net_read_timeout`

  For compatibility with MySQL clients. No practical effect.

- `net_write_timeout`

  For compatibility with MySQL clients. No practical effect.

- `parallel_exchange_instance_num`

  It is used to set the number of exchange nodes used by an upper node to receive data from lower nodes in the execution plan. The default is -1, which means that the number of exchange nodes is equal to the number of execution instances of the underlying nodes (default behavior). When the setting is greater than 0 and less than the number of lower node execution instances, the number of exchange nodes is equal to the set value.

  In a distributed query execution plan, upper nodes usually have one or more exchange nodes for receiving data from execution instances of lower nodes on different computing nodes. Usually the number of exchange nodes is equal to the number of execution instances of the underlying nodes.

  In some aggregation query scenarios, if the amount of data to be scanned at the bottom layer is large, but the amount of data after aggregation is small, you can try to modify this variable to a smaller value, which can reduce the resource overhead of such queries. Such as the scenario of aggregate query on the DUPLICATE KEY detail model.

- `parallel_fragment_exec_instance_num`

  For scanning nodes, set the number of execution instances on each node. The default is 1.

  A query plan usually produces a set of scan ranges, that is, the range of data that needs to be scanned. These data are distributed across multiple nodes. A node will have one or more scan ranges. By default, a set of scan ranges per node is handled by only one execution instance. When the machine resources are abundant, you can increase this variable to allow more execution instances to process a set of scan ranges at the same time, thereby improving query efficiency.

  The number of scan instances determines the number of other upper execution nodes, such as aggregation nodes and join nodes. Therefore, it is equivalent to increasing the concurrency of the entire query plan execution. Modifying this parameter will help improve the efficiency of large queries, but a larger value will consume more machine resources, such as CPU, memory, and disk IO.

- `query_cache_size`

  For compatibility with MySQL clients. No practical effect.

- `query_cache_type`

  Compatible with JDBC connection pool C3P0. No practical effect.

- `query_timeout`

  Used to set query timeout. This variable will act on all query statements in the current connection, as well as INSERT statements. The default is 5 minutes, and the unit is seconds.

- `resource_group`

  Not used yet.

- `send_batch_parallelism`

  It is used to set the default parallelism of sending batch data when performing InsertStmt operation. If the parallelism value exceeds the value in BE configuration, BE `max_send_batch_parallelism_per_job`as the coordination point will use `max_send_batch_parallelism_per_job`the value of .

- `sql_safe_updates`

  For compatibility with MySQL clients. No practical effect.

- `sql_select_limit`

  For compatibility with MySQL clients. No practical effect.

- `system_time_zone`

  Displays the current system time zone. Cannot be changed.

- `time_zone`

  Used to set the time zone for the current session. Time zones can affect the results of some time functions.

- `tx_isolation`

  For compatibility with MySQL clients. No practical effect.

- `tx_read_only`

  For compatibility with MySQL clients. No practical effect.

- `transaction_read_only`

  For compatibility with MySQL clients. No practical effect.

- `transaction_isolation`

  For compatibility with MySQL clients. No practical effect.

- `version`

  For compatibility with MySQL clients. No practical effect.

- `performance_schema`

  Compatible with MySQL JDBC versions 8.0.16 and above. No practical effect.

- `version_comment`

  Used to display the version of Doris. Cannot be changed.

- `wait_timeout`

  It is used to set the connection duration of idle connections. When an idle connection has no interaction with SelectDB within this period, SelectDB will actively disconnect the connection. The default is 8 hours, and the unit is seconds.

- `default_rowset_type`

  It is used to set the default storage format of the compute node storage engine. Currently supported storage formats include: alpha/beta.

- `use_v2_rollup`

  It is used to control the query to obtain data using the rollup index in the segment v2 storage format. This variable is used for verification when segment v2 is launched; otherwise, it is not recommended to use it.

- `rewrite_count_distinct_to_bitmap_hll`

  Whether to rewrite count distinct queries of bitmap and hll types to bitmap_union_count and hll_union_agg.

- `prefer_join_method`

  When choosing whether the specific implementation method of join is broadcast join or shuffle join, if the broadcast join cost and shuffle join cost are equal, which join method is preferred.

  Currently the available values for this variable are "broadcast" or "shuffle".

- `allow_partition_column_nullable`

  Whether to allow the partition column to be NULL when creating the table. The default is true, which means NULL is allowed. false indicates that the partition column must be defined as NOT NULL

- `insert_visible_timeout_ms`

  When executing the insert statement, after the import action (query and insert) is completed, it is necessary to wait for the transaction to be committed to make the data visible. This parameter controls the timeout for waiting for data to become visible, the default is 10000, and the minimum is 1000.

- `enable_exchange_node_parallel_merge`

  In a sorted query, when an upper-level node receives ordered data from a lower-level node, it will perform corresponding sorting on the exchange node to ensure that the final data is in order. However, when a single thread performs multi-channel data merging, if the amount of data is too large, it will cause a single-point merging bottleneck of the exchange node.

  Doris has optimized this part, if there are too many data nodes in the lower layer. The exchange node will start multiple threads for parallel merging to speed up the sorting process. This parameter defaults to False, which means that the exchange node does not adopt parallel merge sort to reduce additional CPU and memory consumption.

- `extract_wide_range_expr`

  It is used to control whether to enable the optimization of "broad common factor extraction". There are two values: true and false. On by default.

- `enable_fold_constant_by_be`

  Used to control how constant folding is computed. The default is `false`, that is, the calculation is `FE`performed at ; if set to `true`, the calculation is `RPC`requested by `BE`.

- `cpu_resource_limit`

  Used to limit the resource overhead of a query. This is an experimental feature. The current implementation limits the number of scan threads for a query on a single node. The number of scan threads is limited, and the data returned from the bottom layer is slowed down, thus limiting the overall computing resource overhead of the query. Assuming it is set to 2, a query uses up to 2 scan threads on a single node.

  This parameter overrides `parallel_fragment_exec_instance_num`the effect of . That is, assume that is `parallel_fragment_exec_instance_num`set to 4 and this parameter is set to 2. Then 4 execution instances on a single node will share up to 2 scanning threads.

  This parameter will be overridden by `cpu_resource_limit`configuration .

  The default is -1, which means no limit.

- `disable_join_reorder`

  Used to turn off all system automatic join reorder algorithms. There are two values: true and false. It is closed by default, that is, the system's automatic join reorder algorithm is used. When set to true, the system will turn off all automatic sorting algorithms, adopt the original table order of SQL, and execute join

- `return_object_data_as_binary`Used to identify whether to return bitmap/hll results in select results. In the select into outfile statement, if the export file format is csv, the bimap/hll data will be base64 encoded, and if it is a parquet file format, the data will be stored as a byte array

- `block_encryption_mode`The block encryption mode can be controlled by the block_encryption_mode parameter, the default value is: empty. When using the AES algorithm to encrypt, it is equivalent to `AES_128_ECB`when using the SM3 algorithm to encrypt. `SM3_128_ECB`Optional value:

```text
  AES_128_ECB,
  AES_192_ECB,
  AES_256_ECB,
  AES_128_CBC,
  AES_192_CBC,
  AES_256_CBC,
  AES_128_CFB,
  AES_192_CFB,
  AES_256_CFB,
  AES_128_CFB1,
  AES_192_CFB1,
  AES_256_CFB1,
  AES_128_CFB8,
  AES_192_CFB8,
  AES_256_CFB8,
  AES_128_CFB128,
  AES_192_CFB128,
  AES_256_CFB128,
  AES_128_CTR,
  AES_192_CTR,
  AES_256_CTR,
  AES_128_OFB,
  AES_192_OFB,
  AES_256_OFB,
  SM4_128_ECB,
  SM4_128_CBC,
  SM4_128_CFB128,
  SM4_128_OFB,
  SM4_128_CTR,
```

- `enable_infer_predicate`

  Used to control whether predicate deduction is performed. There are two values: true and false. By default, it is closed, and the system does not deduce the predicate, and uses the original predicate to perform related operations. When set to true, predicate expansion is performed.

- `trim_tailing_spaces_for_external_table_query`

  It is used to control whether to filter out spaces at the end of fields when querying Hive tables. The default is false.

- `skip_storage_engine_merge` Used for debugging purposes. In the vectorized execution engine, when it is found that there is a problem with reading the data of the Aggregate Key model or the Unique Key model, the value of this variable is set to `true`, and the data of the Aggregate Key model or the Unique Key model will be regarded as the Duplicate Key model read.

- `skip_delete_predicate`

  Used for debugging purposes. In the vectorized execution engine, when it is found that the data result of reading the table is wrong, set the value of this variable to `true`, and the deleted data will be read as normal data.

- `default_password_lifetime`

  The default password expiration time. The default value is 0, which means no expiration. The unit is day. This parameter is enabled only when the user's password expiration attribute is DEFAULT. like:

  ```text
  CREATE USER user1 IDENTIFIED BY "12345" PASSWORD_EXPIRE DEFAULT;
  ALTER USER user1 PASSWORD_EXPIRE DEFAULT;
  ```

- `password_history`

  The default number of historical passwords. The default value is 0, which means no limit. This parameter is enabled only when the user's historical password times attribute is DEFAULT. like:

  ```text
  CREATE USER user1 IDENTIFIED BY "12345" PASSWORD_HISTORY DEFAULT;
  ALTER USER user1 PASSWORD_HISTORY DEFAULT;
  ```

- `validate_password_policy`

  Password strength verification policy. The default is `NONE`or `0`, that is, no verification is performed. Can be set to `STRONG`or `2`. When set to `STRONG`or `2`, when setting a password through the `ALTER USER`or `SET PASSWORD`command, the password must contain 3 items from "uppercase letters", "lowercase letters", "numbers" and "special characters", and the length must be greater than or equal to 8. Special characters include: `~!@#$%^&*()_+|<>,.?/:;'[]{}"`.