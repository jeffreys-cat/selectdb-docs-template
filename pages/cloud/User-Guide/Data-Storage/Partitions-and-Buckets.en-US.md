# Partitions and Buckets

All table engines of SelectDB support two-tier data division.

- The first tier is Partition, which supports the division of Range and List.
- The second tier is Bucket (Tablet), which only supports Hash division.

It is also possible to use only one tier of data division. When using one-tier division, only bucket division is supported.

## Partition

- The Partition column can specify one or more columns, and the partition column must be a KEY column. The usage of multi-column partitioning is introduced later in the summary of multi-column partitioning.
- Regardless of the type of the partition column, double quotes are required when writing the partition value.
- There is theoretically no upper limit to the number of partitions.
- When you do not use Partition to create a table, the system will automatically generate a Partition with the same name as the table name and a full range of values. The Partition is invisible to users and cannot be deleted.
- **Partitions with overlapping ranges cannot be added** when creating partitions.

### Range Partition

- The partition column is usually a time column to facilitate the management of old and new data.

- Partition supports `VALUES LESS THAN (...)`only specifying the upper bound, and the system will use the upper bound of the previous partition as the lower bound of the partition to generate a left-closed and right-open interval. At the same time, it also supports to generate a left-closed and right-open interval by `VALUES [...)`specifying the upper and lower bounds.

- `VALUES [...)`It is easier to understand by specifying both upper and lower bounds. Here is an example to illustrate the changes in the range of partitions when the `VALUES LESS THAN (...)`statement is used to add or delete partitions:

  - As in the `expamle_range_tbl`example , when the table is built, the following three partitions will be automatically generated:

    ```text
    p201701: [MIN_VALUE,  2017-02-01)
    p201702: [2017-02-01, 2017-03-01)
    p201703: [2017-03-01, 2017-04-01)
    ```

    

  - When we add a partition p201705 VALUES LESS THAN ("2017-06-01"), the partition results are as follows:

    ```text
    p201701: [MIN_VALUE,  2017-02-01)
    p201702: [2017-02-01, 2017-03-01)
    p201703: [2017-03-01, 2017-04-01)
    p201705: [2017-04-01, 2017-06-01)
    ```

    

  - At this point we delete the partition p201703, the partition results are as follows:

    ```text
    p201701: [MIN_VALUE,  2017-02-01)
    p201702: [2017-02-01, 2017-03-01)
    p201705: [2017-04-01, 2017-06-01)
    ```

    

    > Note that the partition range of p201702 and p201705 has not changed, and there is a gap between these two partitions: [2017-03-01, 2017-04-01). That is, if the imported data range is within this empty range, it cannot be imported.

  - Continue to delete the partition p201702, the partition results are as follows:

    ```text
    p201701: [MIN_VALUE,  2017-02-01)
    p201705: [2017-04-01, 2017-06-01)
    ```

    

    > The hole range becomes: [2017-02-01, 2017-04-01)

  - Now add a partition p201702new VALUES LESS THAN ("2017-03-01"), the partition results are as follows:

    ```text
    p201701:    [MIN_VALUE,  2017-02-01)
    p201702new: [2017-02-01, 2017-03-01)
    p201705:    [2017-04-01, 2017-06-01)
    ```

    

    > It can be seen that the scope of the hole is reduced to: [2017-03-01, 2017-04-01)

  - Now delete the partition p201701, and add the partition p201612 VALUES LESS THAN ("2017-01-01"), the partition results are as follows:

    ```text
    p201612:    [MIN_VALUE,  2017-01-01)
    p201702new: [2017-02-01, 2017-03-01)
    p201705:    [2017-04-01, 2017-06-01) 
    ```

    

    > That is, a new hole appeared: [2017-01-01, 2017-02-01)

  In summary, the deletion of a partition will not change the range of existing partitions. Deleting a partition may result in holes. When adding a partition through the `VALUES LESS THAN`statement , the lower bound of the partition is immediately the upper bound of the previous partition.

  In addition to the single-column partitions we saw above, Range partitions also support **multi-column partitions** . Examples are as follows:

  ```text
  PARTITION BY RANGE(`date`, `id`)
  (
      PARTITION `p201701_1000` VALUES LESS THAN ("2017-02-01", "1000"),
      PARTITION `p201702_2000` VALUES LESS THAN ("2017-03-01", "2000"),
      PARTITION `p201703_all`  VALUES LESS THAN ("2017-04-01")
  )
  ```

  In the above example, we specified `date` (DATE type) and `id` (INT type) as partition columns. The final partition obtained by the above example is as follows:

     ```
  * p201701_1000:    [(MIN_VALUE,  MIN_VALUE), ("2017-02-01", "1000")   )
  * p201702_2000:    [("2017-02-01", "1000"),  ("2017-03-01", "2000")   )
  * p201703_all:     [("2017-03-01", "2000"),  ("2017-04-01", MIN_VALUE)) 
     ```

  Note that the last partition user only specifies the partition value of the `date` column by default, so the partition value of the `id` column will be filled with `MIN_VALUE` by default. When a user inserts data, the partition column values will be compared sequentially, and finally the corresponding partition will be obtained. Examples are as follows:

     ```
  * Data  -->  Partition
  * 2017-01-01, 200     --> p201701_1000
  * 2017-01-01, 2000    --> p201701_1000
  * 2017-02-01, 100     --> p201701_1000
  * 2017-02-01, 2000    --> p201702_2000
  * 2017-02-15, 5000    --> p201702_2000
  * 2017-03-01, 2000    --> p201703_all
  * 2017-03-10, 1       --> p201703_all
  * 2017-04-01, 1000    --> unable to import
  * 2017-05-01, 1000    --> unable to import
     ```


### List Partition

- The partition column supports the `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DATE, DATETIME, CHAR, VARCHAR`data type, and the partition value is an enumeration value. Only when the data is one of the enumerated values of the target partition, the partition can be hit.

- Partition supports `VALUES IN (...)`to specify the enumeration value contained in each partition.

- The following uses an example to illustrate the changes of partitions when adding and deleting partitions.

  - As in the `example_list_tbl`example , when the table is built, the following three partitions will be automatically generated:

    ```text
    p_cn: ("Beijing", "Shanghai", "Hong Kong")
    p_usa: ("New York", "San Francisco")
    p_jp: ("Tokyo")
    ```

    

  - When we add a partition p_uk VALUES IN ("London"), the partition results are as follows:

    ```text
    p_cn: ("Beijing", "Shanghai", "Hong Kong")
    p_usa: ("New York", "San Francisco")
    p_jp: ("Tokyo")
    p_uk: ("London")
    ```

    

  - When we delete the partition p_jp, the partition results are as follows:

    ```text
    p_cn: ("Beijing", "Shanghai", "Hong Kong")
    p_usa: ("New York", "San Francisco")
    p_uk: ("London")
    ```

    

  List partitioning also supports **multi-column partitioning** , examples are as follows:

  ```text
  PARTITION BY LIST(`id`, `city`)
  (
      PARTITION `p1_city` VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
      PARTITION `p2_city` VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
      PARTITION `p3_city` VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
  )
  ```

  In the above example, we specified `id`(INT type) and `city`(VARCHAR type) as partition columns. The final partition obtained by the above example is as follows:

     ```
  * p1_city: [("1", "Beijing"), ("1", "Shanghai")]
  * p2_city: [("2", "Beijing"), ("2", "Shanghai")]
  * p3_city: [("3", "Beijing"), ("3", "Shanghai")]
     ```

  When a user inserts data, the partition column values will be compared sequentially, and finally the corresponding partition will be obtained. Examples are as follows:

     ```
  * data  --->  partition
  * 1, Beijing     ---> p1_city
  * 1, Shanghai    ---> p1_city
  * 2, Shanghai    ---> p2_city
  * 3, Beijing     ---> p3_city
  * 1, Tianjin     ---> unable to import
  * 4, Beijing     ---> unable to import
     ```


## Bucket

- If Partition is used, the `DISTRIBUTED ...`statement describes the division rules of data in **each partition.** If Partition is not used, it describes the division rules for the data of the entire table.
- The bucketing column can be multiple columns, the Aggregate and Unique models must be Key columns, and the Duplicate model can be key columns and value columns. The bucket column can be the same as or different from the Partition column.
- The selection of bucket columns is a trade-off between query throughput and query concurrency :
  1. If multiple bucketing columns are selected, the data distribution is more even. If a query condition does not contain equivalent conditions for all bucket columns, the query will trigger simultaneous scanning of all buckets, so that the query throughput will increase and the latency of a single query will decrease accordingly. This method is suitable for query scenarios with high throughput and low concurrency.
  2. If only one or a few bucketed columns are selected, the corresponding point query can trigger only one bucketed scan. At this time, when multiple point queries are concurrent, these queries have a high probability of triggering different bucket scans, and the IO impact between each query is small (especially when different buckets are distributed on different disks), so this This method is suitable for high-concurrency point query scenarios.
- The number of buckets is theoretically unlimited.

## Best practices

### Suggestions on the number of Partitions and Buckets and the amount of data

- The total number of tablets in a table is equal to (Partition num * Bucket num).
- The number of tablets in a table is recommended to be slightly larger than the number of disks in the entire cluster, regardless of capacity expansion.
- Theoretically, there is no upper and lower limit for the data volume of a single tablet, but it is recommended to be within the range of 1G - 10G. If the data volume of a single tablet is too small, the data aggregation effect will not be good, and the metadata management pressure will be heavy. If the amount of data is too large, it is not conducive to the migration and completion of the copy, and it will increase the cost of retrying the failure of the Schema Change or Rollup operation (the granularity of the retry of these operation failures is Tablet).
- When the tablet's data volume principle and quantity principle conflict, it is recommended to give priority to the data volume principle.
- When creating a table, the number of buckets for each partition is uniformly specified. But when dynamically adding partitions ( `ADD PARTITION`), you can specify the number of buckets for the new partitions individually. You can use this function to easily deal with data shrinkage or expansion.
- Once the number of Buckets in a Partition is specified, it cannot be changed. Therefore, when determining the number of Buckets, it is necessary to consider the expansion of the cluster in advance. For example, there are only 3 hosts currently, and each host has 1 disk. If the number of buckets is only set to 3 or less, even if you add more machines later, the concurrency cannot be improved.
- To give some examples: Suppose there are 10 BEs, and each BE has one disk. If the total size of a table is 500MB, 4-8 fragments can be considered. 5GB: 8-16 shards. 50GB: 32 shards. 500GB: It is recommended to partition, the size of each partition is about 50GB, and each partition has 16-32 fragments. 5TB: It is recommended to partition, the size of each partition is about 50GB, and each partition has 16-32 fragments.

> Note: The data volume of the table can be viewed through the SHOW DATA command , and the result is divided by the number of replicas, which is the data volume of the table.

1. About the settings and usage scenarios of Random Distribution.
   - If the OLAP table does not have an update type field, set the data bucketing mode of the table to RANDOM, which can avoid serious data skew (when the data is imported into the corresponding partition of the table, the data of each batch of a single import job will be randomly selected a tablet for writing).
   - When the bucketing mode of the table is set to RANDOM, because there is no bucketing column, it is impossible to query only a few buckets according to the value of the bucketing column. When querying the table, all buckets that hit the partition will be scanned at the same time. This setting is suitable for aggregated query analysis of the entire table data but not for high-concurrency point queries.
   - If the data distribution of the OLAP table is Random Distribution, then you can set the single-shard import mode ( `load_to_single_tablet`set to true) when importing data, then when importing a large amount of data, a task writes data to the corresponding When partitioning, only one shard will be written, which will improve the concurrency and throughput of data import, reduce write amplification problems caused by data import and compaction, and ensure the stability of the cluster.

### Use cases where partitions and buckets are used at the same time

- There are time dimensions or similar dimensions with ordered values, and such dimension columns can be used as partition columns. Partition granularity can be evaluated based on import frequency, partition data volume, etc.
- Historical data deletion requirement: If there is a requirement to delete historical data (for example, only keep the data of the last N days). With composite partitions, this can be achieved by deleting historical partitions. You can also delete data by sending a DELETE statement in a specified partition.
- Solve the problem of data skew: each partition can independently specify the number of buckets. For example, if you partition by day, when the amount of data varies greatly every day, you can reasonably divide the data in different partitions by specifying the number of buckets in the partition. It is recommended to choose a column with a high degree of discrimination for the bucket column.

## Dynamic Partition

In some usage scenarios, the user will divide the table into partitions by day, and perform routine tasks regularly every day. At this time, the user needs to manually manage the partitions. Otherwise, the data import may fail because the user has not created a partition. Incurred additional maintenance costs.

Through the dynamic partition function, users can set the rules of dynamic partition when creating a table. SelectDB creates or deletes partitions based on user-specified rules. Users can also make changes to existing rules at runtime.

At present, the function of dynamically adding partitions and dynamically deleting partitions has been realized. Dynamic partitions only support Range partitions.

### How to use

The rules of dynamic partitioning can be specified when creating a table, or modified at runtime. Currently, only dynamic partition rules are supported for partition tables with a single partition column.

- Specify when creating the table:

  ```sql
  CREATE TABLE tbl1
  (...)
  PROPERTIES
  (
      "dynamic_partition.prop1" = "value1",
      "dynamic_partition.prop2" = "value2",
      ...
  )
  ```

  

- runtime modification

  ```sql
  ALTER TABLE tbl1 SET
  (
      "dynamic_partition.prop1" = "value1",
      "dynamic_partition.prop2" = "value2",
      ...
  )
  ```

  

### Dynamic Partition Rule Parameters

The rule parameters `dynamic_partition.`for prefixed with :

- `dynamic_partition.enable`

  Whether to enable the dynamic partition feature. Can be specified as `TRUE`or `FALSE`. If not filled, the default is `TRUE`. If yes `FALSE`, dynamic partitioning rules for the table are ignored.

- `dynamic_partition.time_unit`

  The unit of dynamic partition scheduling. Can be specified as `HOUR`, `DAY`, `WEEK`, `MONTH`. Respectively represent creating or deleting partitions by hour, day, week, and month.

  When specified `HOUR`as , the dynamically created partition name suffix format is `yyyyMMddHH`, eg `2020032501`. The data type of the hourly partition column cannot be DATE.

  When specified `DAY`as , the dynamically created partition name suffix format is `yyyyMMdd`, eg `20200325`.

  When specified `WEEK`as , the dynamically created partition name suffix format is `yyyy_ww`. That is, the current date belongs to the week of the year. For example, the suffix of the `2020-03-25`created partition name is `2020_13`, indicating that it is currently the 13th week of 2020.

  When specified `MONTH`as , the dynamically created partition name suffix format is `yyyyMM`, eg `202003`.

- `dynamic_partition.time_zone`

  The time zone of the dynamic partition. If it is not filled in, it will default to the time zone of the system of the current machine. For example `Asia/Shanghai`, if you want to get the currently supported time zone settings, you can refer to it `https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`.

- `dynamic_partition.start`

  The starting offset of the dynamic partition, which is a negative number. Depending on the `time_unit`attribute , based on the current day (week/month), the partitions whose partition range is before this offset will be deleted. If not filled, the default is `-2147483648`, that is, the history partition will not be deleted.

- `dynamic_partition.end`

  The end offset of the dynamic partition, which is a positive number. According to different `time_unit`attributes , based on the current day (week/month), create partitions of the corresponding range in advance.

- `dynamic_partition.prefix`

  Dynamically created partition name prefix.

- `dynamic_partition.buckets`

  The number of buckets corresponding to dynamically created partitions.

- `dynamic_partition.replication_num`

  The number of replicas corresponding to dynamically created partitions. If not filled in, the default is the number of replicas specified when the table was created.

- `dynamic_partition.start_day_of_week`

  When `time_unit`is `WEEK`, this parameter is used to specify the starting point of each week. Values are 1 to 7. Where 1 means Monday and 7 means Sunday. The default is 1, which means that every week starts from Monday.

- `dynamic_partition.start_day_of_month`

  When `time_unit`is `MONTH`, this parameter is used to specify the starting date of each month. Values are 1 to 28. Among them, 1 means the 1st of every month, and 28 means the 28th of every month. The default is 1, which means that every month starts with the 1st position. To avoid ambiguity caused by leap year or leap month, 29, 30, and 31 are not supported for the time being.

- `dynamic_partition.create_history_partition`

  The default is false. When set to true, all partitions will be created automatically, see below for specific creation rules. At the same time, the parameters of FE `max_dynamic_partition_num`will limit the total number of partitions to avoid creating too many partitions at one time. When the number of partitions expected to be created is greater than the `max_dynamic_partition_num`value , the operation will be prohibited.

  When the `start`attribute , this parameter does not take effect.

- `dynamic_partition.history_partition_num`

  When `create_history_partition`is `true`, this parameter is used to specify the number of historical partitions to be created. The default value is -1, which is not set.

- `dynamic_partition.reserved_history_periods`

  The time range of historical partitions that need to be kept. When `dynamic_partition.time_unit`is set to "DAY/WEEK/MONTH", it needs to be set in `[yyyy-MM-dd,yyyy-MM-dd],[...,...]`format . When `dynamic_partition.time_unit`is set to "HOUR", it needs to be set in `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]`the format of . If not set, defaults to `"NULL"`.

  Let's illustrate with an example. Suppose today is 2021-09-06, classified by day, the properties of the dynamic partition are set to:

  `time_unit="DAY/WEEK/MONTH", end=3, start=-3, reserved_history_periods="[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"`.

  Then the system will automatically keep:

  ```text
  ["2020-06-01","2020-06-20"],
  ["2020-10-31","2020-11-15"]
  ```

  

  or

  `time_unit="HOUR", end=3, start=-3, reserved_history_periods="[2020-06-01 00:00:00,2020-06-01 03:00:00]"`.

  Then the system will automatically keep:

  ```text
  ["2020-06-01 00:00:00","2020-06-01 03:00:00"]
  ```

  

  The division of the two time periods. Among them, `reserved_history_periods`each of `[...,...]`is a pair of setting items, both need to be set at the same time, and the first time cannot be greater than the second time.

### Create historical partition rules

When `create_history_partition`is `true`, that is, when the function of creating historical partitions is enabled, SelectDB `dynamic_partition.start`will `dynamic_partition.history_partition_num`determine the number of historical partitions to be created according to and .

Assuming that the number of historical partitions to be created is `expect_create_partition_num`, the specific number is as follows according to different settings:

1. ```
   create_history_partition = true
   ```

   - `dynamic_partition.history_partition_num`Not set, i.e. -1. `expect_create_partition_num`= `end`- `start`;
   - `dynamic_partition.history_partition_num`set `expect_create_partition_num`= `end`- max( `start`, `-histoty_partition_num`);

2. ```
   create_history_partition= false
   ```
   - no history partition will be created, `expect_create_partition_num`= `end`- 0;

When `expect_create_partition_num`is greater than `max_dynamic_partition_num`(500 by default), it is forbidden to create too many partitions.

**for example:**

1. Suppose today is 2021-05-20, partition by day, and the attribute of dynamic partition is set to: `create_history_partition=true, end=3, start=-3, history_partition_num=1`, the system will automatically create the following partitions:

   ```text
   p20210519
   p20210520
   p20210521
   p20210522
   p20210523
	```

2. `history_partition_num=5`, and the rest of the attributes remain the same as in 1, the system will automatically create the following partitions:

   ```text
   p20210517
   p20210518
   p20210519
   p20210520
   p20210521
   p20210522
   p20210523
	```

   

3. `history_partition_num=-1`That is, if you do not set the number of historical partitions, and keep the rest of the attributes consistent with 1, the system will automatically create the following partitions:

   ```text
   p20210517
   p20210518
   p20210519
   p20210520
   p20210521
   p20210522
   p20210523
   ```

   

#### Precautions

During the use of dynamic partitions, if some partitions between `dynamic_partition.start`and , the lost partitions between`dynamic_partition.end` the current time and will be recreated, and the lost partitions between and the current time will not be recreated.`dynamic_partition.end``dynamic_partition.start`

#### Example

1. Table tbl1 partition column k1 type is DATE, create a dynamic partition rule. Partition by day, only retain the partitions of the last 7 days, and pre-create the partitions of the next 3 days.

   ```sql
   CREATE TABLE tbl1
   (
       k1 DATE,
       ...
   )
   PARTITION BY RANGE(k1) ()
   DISTRIBUTED BY HASH(k1)
   PROPERTIES
   (
       "dynamic_partition.enable" = "true",
       "dynamic_partition.time_unit" = "DAY",
       "dynamic_partition.start" = "-7",
       "dynamic_partition.end" = "3",
       "dynamic_partition.prefix" = "p",
       "dynamic_partition.buckets" = "32"
   );
   ```

   

   Suppose the current date is 2020-05-29. According to the above rules, tbl1 will generate the following partitions:

   ```text
   p20200529: ["2020-05-29", "2020-05-30")
   p20200530: ["2020-05-30", "2020-05-31")
   p20200531: ["2020-05-31", "2020-06-01")
   p20200601: ["2020-06-01", "2020-06-02")
   ```

   

   On the second day, 2020-05-30, a new partition will be created`p20200602: ["2020-06-02", "2020-06-03")`

   On 2020-06-06, because `dynamic_partition.start`is set to 7, the partition 7 days ago will be deleted, that is, the partition will be deleted `p20200529`.

2. Table tbl1 partition column k1 type is DATETIME, create a dynamic partition rule. Partition by week, only keep the partitions of the last 2 weeks, and create the partitions of the next 2 weeks in advance.

   ```sql
   CREATE TABLE tbl1
   (
       k1 DATETIME,
       ...
   )
   PARTITION BY RANGE(k1) ()
   DISTRIBUTED BY HASH(k1)
   PROPERTIES
   (
       "dynamic_partition.enable" = "true",
       "dynamic_partition.time_unit" = "WEEK",
       "dynamic_partition.start" = "-2",
       "dynamic_partition.end" = "2",
       "dynamic_partition.prefix" = "p",
       "dynamic_partition.buckets" = "8"
   );
   ```

   

   Assume that the current date is 2020-05-29, which is the 22nd week of 2020. The default start of week is Monday. Based on the above rules, tbl1 will generate the following partitions:

   ```text
   p2020_22: ["2020-05-25 00:00:00", "2020-06-01 00:00:00")
   p2020_23: ["2020-06-01 00:00:00", "2020-06-08 00:00:00")
   p2020_24: ["2020-06-08 00:00:00", "2020-06-15 00:00:00")
   ```

   

   The start date of each partition is the Monday of the current week. At the same time, because the type of the partition column k1 is DATETIME, the partition value will complete the hour, minute and second part, and all of them are 0.

   On 2020-06-15, that is, the 25th week, the partition that was 2 weeks ago will be deleted, that is, deleted `p2020_22`.

   In the above example, assume that the user specifies the starting day of the week as `"dynamic_partition.start_day_of_week" = "3"`, that is, every Wednesday as the starting day. Then the partition is as follows:

   ```text
   p2020_22: ["2020-05-27 00:00:00", "2020-06-03 00:00:00")
   p2020_23: ["2020-06-03 00:00:00", "2020-06-10 00:00:00")
   p2020_24: ["2020-06-10 00:00:00", "2020-06-17 00:00:00")
   ```

   

   That is, the partition range is from Wednesday of the current week to Tuesday of the next week.

   - Note: 2019-12-31 and 2020-01-01 are in the same week, if the start date of the partition is 2019-12-31, then the name of the partition `p2019_53`, if the start date of the partition is 2020-01-01, then The partition name is `p2020_01`.

3. Table tbl1 partition column k1 type is DATE, create a dynamic partition rule. Partition by month, do not delete historical partitions, and create partitions for the next 2 months in advance. At the same time, set the starting date on the 3rd of each month.

   ```sql
   CREATE TABLE tbl1
   (
       k1 DATE,
       ...
   )
   PARTITION BY RANGE(k1) ()
   DISTRIBUTED BY HASH(k1)
   PROPERTIES
   (
       "dynamic_partition.enable" = "true",
       "dynamic_partition.time_unit" = "MONTH",
       "dynamic_partition.end" = "2",
       "dynamic_partition.prefix" = "p",
       "dynamic_partition.buckets" = "8",
       "dynamic_partition.start_day_of_month" = "3"
   );
   ```

   

   Suppose the current date is 2020-05-29. Based on the above rules, tbl1 will generate the following partitions:

   ```text
   p202005: ["2020-05-03", "2020-06-03")
   p202006: ["2020-06-03", "2020-07-03")
   p202007: ["2020-07-03", "2020-08-03")
   ```

   

   Because it is not set `dynamic_partition.start`, the history partition will not be deleted.

   Assuming today is 2020-05-20, and the starting date is set on the 28th of each month, the partition range is:

   ```text
   p202004: ["2020-04-28", "2020-05-28")
   p202005: ["2020-05-28", "2020-06-28")
   p202006: ["2020-06-28", "2020-07-28")
   ```

   

### Modify dynamic partition properties

The attributes of dynamic partitions can be modified by the following command:

```sql
ALTER TABLE tbl1 SET
(
    "dynamic_partition.prop1" = "value1",
    ...
);
```



Modifications of certain properties may create conflicts. Assume that the previous partition granularity is DAY, and the following partitions have been created:

```text
p20200519: ["2020-05-19", "2020-05-20")
p20200520: ["2020-05-20", "2020-05-21")
p20200521: ["2020-05-21", "2020-05-22")
```



If the partition granularity is changed to MONTH at this time, the system will try to create `["2020-05-01", "2020-06-01")`a , but the partition range of this partition conflicts with the existing partition, so it cannot be created. However `["2020-06-01", "2020-07-01")`, can be created normally. Therefore, the partition from 2020-05-22 to 2020-05-30 needs to be filled by itself.

### View dynamic partition table

You can further check the scheduling status of all dynamic partition tables under the current database by using the following command:

```sql
mysql> SHOW DYNAMIC PARTITION TABLES;
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| d3        | true   | WEEK     | -3          | 3    | p      | 1       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| d5        | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d4        | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
| d6        | true   | MONTH    | -2147483648 | 2    | p      | 8       | 3rd       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d2        | true   | DAY      | -3          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d7        | true   | MONTH    | -2147483648 | 5    | p      | 8       | 24th      | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
7 rows in set (0.02 sec)
```



- LastUpdateTime: The time when the dynamic partition attribute was last modified
- LastSchedulerTime: The time when dynamic partition scheduling was last executed
- State: The state of the last execution of dynamic partition scheduling
- LastCreatePartitionMsg: Error message of the last execution of dynamic adding partition scheduling
- LastDropPartitionMsg: The error message of the last execution of dynamic drop partition scheduling

### Advanced operations

#### Configuration item

- dynamic_partition_enable

  Whether to enable the dynamic partition function. The default is false, that is, off. This parameter only affects the partition operation of the dynamic partition table, not the ordinary table. The following commands can be executed at runtime to take effect:

  `ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true")`

  To disable dynamic partition globally, set this parameter to false.

- dynamic_partition_check_interval_seconds

  The execution frequency of the dynamic partition thread is 600 (10 minutes) by default, that is, scheduling is performed every 10 minutes. You can execute the following command modification at runtime:

  `ADMIN SET FRONTEND CONFIG ("dynamic_partition_check_interval_seconds" = "7200")`

#### Conversion between dynamic partition table and manual partition table

For a table, dynamic partition and manual partition can be converted freely, but the two cannot exist at the same time, and there is only one state.

1. **Convert manual partitions to dynamic partitions**

   If a table does not specify a dynamic partition when it is created, it can be converted to a dynamic partition by modifying the properties related to the dynamic partition `ALTER TABLE`at runtime. For specific examples, `HELP ALTER TABLE`see .

   After the dynamic partition function is enabled, the user will no longer be allowed to manually manage the partitions, and the partitions will be managed automatically according to the dynamic partition attributes.

   **Note** : If it is set `dynamic_partition.start`, the historical partition whose partition range is before the start offset of the dynamic partition will be deleted.

2. **Dynamic Partitioning Converted to Manual Partitioning**

   The dynamic partition function can be turned off by executing `ALTER TABLE tbl_name SET ("dynamic_partition.enable" = "false")`to convert it to a manual partition table.

   After the dynamic partition function is turned off, the partition will no longer be managed automatically, and the user needs to manually create or delete `ALTER TABLE`the partition.

### Frequently asked questions

1. Prompt after creating dynamic partition table`Could not create table with dynamic partition when fe config dynamic_partition_enable is false`

   Because the master switch of dynamic partition `dynamic_partition_enable`is false, the dynamic partition table cannot be created.

   Execute the command ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true") to turn on the dynamic partition switch.

2. About replica settings for dynamic partitions

   Dynamic partitions are created automatically by the scheduling logic inside the system. When automatically creating partitions, the partition attributes used (including the number of replicas of the partition, etc.) are all attributes that use the `dynamic_partition`prefix instead of using the default attributes of the table. for example:

   ```text
   CREATE TABLE tbl1 (
   `k1` int,
   `k2` date
   )
   PARTITION BY RANGE(k2)()
   DISTRIBUTED BY HASH(k1) BUCKETS 3
   PROPERTIES
   (
   "dynamic_partition.enable" = "true",
   "dynamic_partition.time_unit" = "DAY",
   "dynamic_partition.end" = "3",
   "dynamic_partition.prefix" = "p",
   "dynamic_partition.buckets" = "32",
   "dynamic_partition.replication_num" = "1",
   "dynamic_partition.start" = "-3",
   "replication_num" = "3"
   );
   ```

   

   In this example, no initial partitions are created (the partition definition in the PARTITION BY clause is empty), and `DISTRIBUTED BY HASH(k1) BUCKETS 3`, `"replication_num" = "3"`, `"dynamic_partition.replication_num" = "1"`and are set `"dynamic_partition.buckets" = "32"`.

   We make the first two parameters the default parameters for the table, and the last two parameters are dedicated parameters for dynamic partitioning.

   When the system automatically creates partitions, it will use the two configurations of bucket number 32 and copy number 1 (that is, dynamic partition special parameters). Instead of the two configurations of bucket number 3 and replica number 3.

   When the user manually adds partitions through the `ALTER TABLE tbl1 ADD PARTITION`statement , the two configurations of bucket number 3 and copy number 3 (that is, the default parameters of the table) will be used.

   That is, dynamic partitioning uses a set of independent parameter settings. The table's default parameters are used only if no dynamic partition-specific parameters are set. as follows:

   ```text
   CREATE TABLE tbl2 (
   `k1` int,
   `k2` date
   )
   PARTITION BY RANGE(k2)()
   DISTRIBUTED BY HASH(k1) BUCKETS 3
   PROPERTIES
   (
   "dynamic_partition.enable" = "true",
   "dynamic_partition.time_unit" = "DAY",
   "dynamic_partition.end" = "3",
   "dynamic_partition.prefix" = "p",
   "dynamic_partition.start" = "-3",
   "dynamic_partition.buckets" = "32",
   "replication_num" = "3"
   );
   ```

   

   In this example, if not specified separately `dynamic_partition.replication_num`, the dynamic partition will use the default parameters of the table, ie `"replication_num" = "3"`.

   And the following example:

   ```text
   CREATE TABLE tbl3 (
   `k1` int,
   `k2` date
   )
   PARTITION BY RANGE(k2)(
       PARTITION p1 VALUES LESS THAN ("2019-10-10")
   )
   DISTRIBUTED BY HASH(k1) BUCKETS 3
   PROPERTIES
   (
   "dynamic_partition.enable" = "true",
   "dynamic_partition.time_unit" = "DAY",
   "dynamic_partition.end" = "3",
   "dynamic_partition.prefix" = "p",
   "dynamic_partition.start" = "-3",
   "dynamic_partition.buckets" = "32",
   "dynamic_partition.replication_num" = "1",
   "replication_num" = "3"
   );
   ```

   

   In this example, there is a manually created partition p1. This partition will use the table's default settings of 3 buckets and 3 replicas. The dynamic partitions automatically created by the subsequent system will still use the special parameters for dynamic partitions, that is, the number of buckets is 32 and the number of copies is 1.