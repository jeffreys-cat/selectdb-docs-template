# 分区分桶

SelectDB所有的表引擎都支持两层的数据划分。

- 第一层是 Partition，支持 Range 和 List 的划分方式。
- 第二层是 Bucket（Tablet），仅支持 Hash 的划分方式。

也可以仅使用一层分区。使用一层分区时，只支持 Bucket 划分。

## 分区

   - Partition 列可以指定一列或多列，分区列必须为 KEY 列。多列分区的使用方式在后面 **多列分区** 小结介绍。
   - 不论分区列是什么类型，在写分区值时，都需要加双引号。
   - 分区数量理论上没有上限。
   - 当不使用 Partition 建表时，系统会自动生成一个和表名同名的，全值范围的 Partition。该 Partition 对用户不可见，并且不可删改。
   - 创建分区时**不可添加范围重叠**的分区。

### Range 分区

   - 分区列通常为时间列，以方便的管理新旧数据。

   - Partition 支持通过 `VALUES LESS THAN (...)` 仅指定上界，系统会将前一个分区的上界作为该分区的下界，生成一个左闭右开的区间。同时，也支持通过 `VALUES [...)` 指定上下界，生成一个左闭右开的区间。

   - 通过 `VALUES [...)` 同时指定上下界比较容易理解。这里举例说明，当使用 `VALUES LESS THAN (...)` 语句进行分区的增删操作时，分区范围的变化情况：

     - 如上 `expamle_range_tbl` 示例，当建表完成后，会自动生成如下3个分区：

       ```text
       p201701: [MIN_VALUE,  2017-02-01)
       p201702: [2017-02-01, 2017-03-01)
       p201703: [2017-03-01, 2017-04-01)
       ```

     - 当我们增加一个分区 p201705 VALUES LESS THAN ("2017-06-01")，分区结果如下：

       ```text
       p201701: [MIN_VALUE,  2017-02-01)
       p201702: [2017-02-01, 2017-03-01)
       p201703: [2017-03-01, 2017-04-01)
       p201705: [2017-04-01, 2017-06-01)
       ```

     - 此时我们删除分区 p201703，则分区结果如下：

       ```text
       p201701: [MIN_VALUE,  2017-02-01)
       p201702: [2017-02-01, 2017-03-01)
       p201705: [2017-04-01, 2017-06-01)
       ```

       > 注意到 p201702 和 p201705 的分区范围并没有发生变化，而这两个分区之间，出现了一个空洞：[2017-03-01, 2017-04-01)。即如果导入的数据范围在这个空洞范围内，是无法导入的。

     - 继续删除分区 p201702，分区结果如下：

       ```text
       p201701: [MIN_VALUE,  2017-02-01)
       p201705: [2017-04-01, 2017-06-01)
       ```

       > 空洞范围变为：[2017-02-01, 2017-04-01)

     - 现在增加一个分区 p201702new VALUES LESS THAN ("2017-03-01")，分区结果如下：

       ```text
       p201701:    [MIN_VALUE,  2017-02-01)
       p201702new: [2017-02-01, 2017-03-01)
       p201705:    [2017-04-01, 2017-06-01)
       ```

       > 可以看到空洞范围缩小为：[2017-03-01, 2017-04-01)

     - 现在删除分区 p201701，并添加分区 p201612 VALUES LESS THAN ("2017-01-01")，分区结果如下：

       ```text
       p201612:    [MIN_VALUE,  2017-01-01)
       p201702new: [2017-02-01, 2017-03-01)
       p201705:    [2017-04-01, 2017-06-01) 
       ```

       > 即出现了一个新的空洞：[2017-01-01, 2017-02-01)

   综上，分区的删除不会改变已存在分区的范围。删除分区可能出现空洞。通过 `VALUES LESS THAN` 语句增加分区时，分区的下界紧接上一个分区的上界。

   Range分区除了上述我们看到的单列分区，也支持**多列分区**，示例如下：

   ```text
   PARTITION BY RANGE(`date`, `id`)
   (
       PARTITION `p201701_1000` VALUES LESS THAN ("2017-02-01", "1000"),
       PARTITION `p201702_2000` VALUES LESS THAN ("2017-03-01", "2000"),
       PARTITION `p201703_all`  VALUES LESS THAN ("2017-04-01")
   )
   ```

   在以上示例中，我们指定 `date`(DATE 类型) 和 `id`(INT 类型) 作为分区列。以上示例最终得到的分区如下：

   ```
   * p201701_1000:    [(MIN_VALUE,  MIN_VALUE), ("2017-02-01", "1000")   )
   * p201702_2000:    [("2017-02-01", "1000"),  ("2017-03-01", "2000")   )
   * p201703_all:     [("2017-03-01", "2000"),  ("2017-04-01", MIN_VALUE)) 
   ```

   注意，最后一个分区用户缺省只指定了 `date` 列的分区值，所以 `id` 列的分区值会默认填充 `MIN_VALUE`。当用户插入数据时，分区列值会按照顺序依次比较，最终得到对应的分区。举例如下：

   ```
   * 数据  -->  分区
   * 2017-01-01, 200     --> p201701_1000
   * 2017-01-01, 2000    --> p201701_1000
   * 2017-02-01, 100     --> p201701_1000
   * 2017-02-01, 2000    --> p201702_2000
   * 2017-02-15, 5000    --> p201702_2000
   * 2017-03-01, 2000    --> p201703_all
   * 2017-03-10, 1       --> p201703_all
   * 2017-04-01, 1000    --> 无法导入
   * 2017-05-01, 1000    --> 无法导入
   ```

### List 分区

   - 分区列支持 `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DATE, DATETIME, CHAR, VARCHAR` 数据类型，分区值为枚举值。只有当数据为目标分区枚举值其中之一时，才可以命中分区。

   - Partition 支持通过 `VALUES IN (...)` 来指定每个分区包含的枚举值。

   - 下面通过示例说明，进行分区的增删操作时，分区的变化。

     - 如上 `example_list_tbl` 示例，当建表完成后，会自动生成如下3个分区：

       ```text
       p_cn: ("Beijing", "Shanghai", "Hong Kong")
       p_usa: ("New York", "San Francisco")
       p_jp: ("Tokyo")
       ```

     - 当我们增加一个分区 p_uk VALUES IN ("London")，分区结果如下：

       ```text
       p_cn: ("Beijing", "Shanghai", "Hong Kong")
       p_usa: ("New York", "San Francisco")
       p_jp: ("Tokyo")
       p_uk: ("London")
       ```

     - 当我们删除分区 p_jp，分区结果如下：

       ```text
       p_cn: ("Beijing", "Shanghai", "Hong Kong")
       p_usa: ("New York", "San Francisco")
       p_uk: ("London")
       ```

   List分区也支持**多列分区**，示例如下：

   ```text
   PARTITION BY LIST(`id`, `city`)
   (
       PARTITION `p1_city` VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
       PARTITION `p2_city` VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
       PARTITION `p3_city` VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
   )
   ```

   在以上示例中，我们指定 `id`(INT 类型) 和 `city`(VARCHAR 类型) 作为分区列。以上示例最终得到的分区如下：

   ```
   * p1_city: [("1", "Beijing"), ("1", "Shanghai")]
   * p2_city: [("2", "Beijing"), ("2", "Shanghai")]
   * p3_city: [("3", "Beijing"), ("3", "Shanghai")]
   ```

   当用户插入数据时，分区列值会按照顺序依次比较，最终得到对应的分区。举例如下：

   ```
   * 数据  --->  分区
   * 1, Beijing     ---> p1_city
   * 1, Shanghai    ---> p1_city
   * 2, Shanghai    ---> p2_city
   * 3, Beijing     ---> p3_city
   * 1, Tianjin     ---> 无法导入
   * 4, Beijing     ---> 无法导入
   ```

## 分桶

   - 如果使用了 Partition，则 `DISTRIBUTED ...` 语句描述的是数据在**各个分区内**的划分规则。如果不使用 Partition，则描述的是对整个表的数据的划分规则。
   - 分桶列可以是多列，Aggregate 和 Unique 模型必须为 Key 列，Duplicate 模型可以是 key 列和 value 列。分桶列可以和 Partition 列相同或不同。
   - 分桶列的选择，是在 **查询吞吐** 和 **查询并发** 之间的一种权衡：
     1. 如果选择多个分桶列，则数据分布更均匀。如果一个查询条件不包含所有分桶列的等值条件，那么该查询会触发所有分桶同时扫描，这样查询的吞吐会增加，单个查询的延迟随之降低。这个方式适合大吞吐低并发的查询场景。
     2. 如果仅选择一个或少数分桶列，则对应的点查询可以仅触发一个分桶扫描。此时，当多个点查询并发时，这些查询有较大的概率分别触发不同的分桶扫描，各个查询之间的IO影响较小（尤其当不同桶分布在不同磁盘上时），所以这种方式适合高并发的点查询场景。
   - 分桶的数量理论上没有上限。

## 最佳实践

### Partition 和 Bucket 的数量和数据量的建议

- 一个表的 Tablet 总数量等于 (Partition num * Bucket num)。
- 一个表的 Tablet 数量，在不考虑扩容的情况下，推荐略多于整个集群的磁盘数量。
- 单个 Tablet 的数据量理论上没有上下界，但建议在 1G - 10G 的范围内。如果单个 Tablet 数据量过小，则数据的聚合效果不佳，且元数据管理压力大。如果数据量过大，则不利于副本的迁移、补齐，且会增加 Schema Change 或者 Rollup 操作失败重试的代价（这些操作失败重试的粒度是 Tablet）。
- 当 Tablet 的数据量原则和数量原则冲突时，建议优先考虑数据量原则。
- 在建表时，每个分区的 Bucket 数量统一指定。但是在动态增加分区时（`ADD PARTITION`），可以单独指定新分区的 Bucket 数量。可以利用这个功能方便的应对数据缩小或膨胀。
- 一个 Partition 的 Bucket 数量一旦指定，不可更改。所以在确定 Bucket 数量时，需要预先考虑集群扩容的情况。比如当前只有 3 台 host，每台 host 有 1 块盘。如果 Bucket 的数量只设置为 3 或更小，那么后期即使再增加机器，也不能提高并发度。
- 举一些例子：假设在有10台BE，每台BE一块磁盘的情况下。如果一个表总大小为 500MB，则可以考虑4-8个分片。5GB：8-16个分片。50GB：32个分片。500GB：建议分区，每个分区大小在 50GB 左右，每个分区16-32个分片。5TB：建议分区，每个分区大小在 50GB 左右，每个分区16-32个分片。

> 注：表的数据量可以通过 [`SHOW DATA`](../sql-manual/sql-reference/Show-Statements/SHOW-DATA.md) 命令查看，结果除以副本数，即表的数据量。

3. **关于 Random Distribution 的设置以及使用场景。**   
    - 如果 OLAP 表没有更新类型的字段，将表的数据分桶模式设置为 RANDOM，则可以避免严重的数据倾斜(数据在导入表对应的分区的时候，单次导入作业每个 batch 的数据将随机选择一个tablet进行写入)。
    - 当表的分桶模式被设置为RANDOM 时，因为没有分桶列，无法根据分桶列的值仅对几个分桶查询，对表进行查询的时候将对命中分区的全部分桶同时扫描，该设置适合对表数据整体的聚合查询分析而不适合高并发的点查询。
    - 如果 OLAP 表的是 Random Distribution 的数据分布，那么在数据导入的时候可以设置单分片导入模式（将 `load_to_single_tablet` 设置为 true），那么在大数据量的导入的时候，一个任务在将数据写入对应的分区时将只写入一个分片，这样将能提高数据导入的并发度和吞吐量，减少数据导入和 Compaction
    导致的写放大问题，保障集群的稳定性。 

### 分区分桶同时使用的场景

- 有时间维度或类似带有有序值的维度，可以以这类维度列作为分区列。分区粒度可以根据导入频次、分区数据量等进行评估。
- 历史数据删除需求：如有删除历史数据的需求（比如仅保留最近N 天的数据）。使用复合分区，可以通过删除历史分区来达到目的。也可以通过在指定分区内发送 DELETE 语句进行数据删除。
- 解决数据倾斜问题：每个分区可以单独指定分桶数量。如按天分区，当每天的数据量差异很大时，可以通过指定分区的分桶数，合理划分不同分区的数据,分桶列建议选择区分度大的列。



## 动态分区

在某些使用场景下，用户会将表按照天进行分区划分，每天定时执行例行任务，这时需要使用方手动管理分区，否则可能由于使用方没有创建分区导致数据导入失败，这给使用方带来了额外的维护成本。

通过动态分区功能，用户可以在建表时设定动态分区的规则。SelectDB根据用户指定的规则创建或删除分区。用户也可以在运行时对现有规则进行变更。

目前实现了动态添加分区及动态删除分区的功能。动态分区只支持 Range 分区。

### 使用方式

动态分区的规则可以在建表时指定，或者在运行时进行修改。当前仅支持对单分区列的分区表设定动态分区规则。

- 建表时指定：

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

- 运行时修改

  ```sql
  ALTER TABLE tbl1 SET
  (
      "dynamic_partition.prop1" = "value1",
      "dynamic_partition.prop2" = "value2",
      ...
  )
  ```

### 动态分区规则参数

动态分区的规则参数都以 `dynamic_partition.` 为前缀：

- `dynamic_partition.enable`

  是否开启动态分区特性。可指定为 `TRUE` 或 `FALSE`。如果不填写，默认为 `TRUE`。如果为 `FALSE`，则会忽略该表的动态分区规则。

- `dynamic_partition.time_unit`

  动态分区调度的单位。可指定为 `HOUR`、`DAY`、`WEEK`、`MONTH`。分别表示按小时、按天、按星期、按月进行分区创建或删除。

  当指定为 `HOUR` 时，动态创建的分区名后缀格式为 `yyyyMMddHH`，例如`2020032501`。小时为单位的分区列数据类型不能为 DATE。

  当指定为 `DAY` 时，动态创建的分区名后缀格式为 `yyyyMMdd`，例如`20200325`。

  当指定为 `WEEK` 时，动态创建的分区名后缀格式为`yyyy_ww`。即当前日期属于这一年的第几周，例如 `2020-03-25` 创建的分区名后缀为 `2020_13`, 表明目前为2020年第13周。

  当指定为 `MONTH` 时，动态创建的分区名后缀格式为 `yyyyMM`，例如 `202003`。

- `dynamic_partition.time_zone`

  动态分区的时区，如果不填写，则默认为当前机器的系统的时区，例如 `Asia/Shanghai`，如果想获取当前支持的时区设置，可以参考 `https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`。

- `dynamic_partition.start`

  动态分区的起始偏移，为负数。根据 `time_unit` 属性的不同，以当天（星期/月）为基准，分区范围在此偏移之前的分区将会被删除。如果不填写，则默认为 `-2147483648`，即不删除历史分区。

- `dynamic_partition.end`

  动态分区的结束偏移，为正数。根据 `time_unit` 属性的不同，以当天（星期/月）为基准，提前创建对应范围的分区。

- `dynamic_partition.prefix`

  动态创建的分区名前缀。

- `dynamic_partition.buckets`

  动态创建的分区所对应的分桶数量。

- `dynamic_partition.replication_num`

  动态创建的分区所对应的副本数量，如果不填写，则默认为该表创建时指定的副本数量。

- `dynamic_partition.start_day_of_week`

  当 `time_unit` 为 `WEEK` 时，该参数用于指定每周的起始点。取值为 1 到 7。其中 1 表示周一，7 表示周日。默认为 1，即表示每周以周一为起始点。

- `dynamic_partition.start_day_of_month`

  当 `time_unit` 为 `MONTH` 时，该参数用于指定每月的起始日期。取值为 1 到 28。其中 1 表示每月1号，28 表示每月28号。默认为 1，即表示每月以1号位起始点。暂不支持以29、30、31号为起始日，以避免因闰年或闰月带来的歧义。

- `dynamic_partition.create_history_partition`

  默认为 false。当置为 true 时， 会自动创建所有分区，具体创建规则见下文。同时，FE 的参数 `max_dynamic_partition_num` 会限制总分区数量，以避免一次性创建过多分区。当期望创建的分区个数大于 `max_dynamic_partition_num` 值时，操作将被禁止。

  当不指定 `start` 属性时，该参数不生效。

- `dynamic_partition.history_partition_num`

  当 `create_history_partition` 为 `true` 时，该参数用于指定创建历史分区数量。默认值为 -1， 即未设置。

- `dynamic_partition.reserved_history_periods`

  需要保留的历史分区的时间范围。当`dynamic_partition.time_unit` 设置为 "DAY/WEEK/MONTH" 时，需要以 `[yyyy-MM-dd,yyyy-MM-dd],[...,...]` 格式进行设置。当`dynamic_partition.time_unit` 设置为 "HOUR" 时，需要以 `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` 的格式来进行设置。如果不设置，默认为 `"NULL"`。

  我们举例说明。假设今天是 2021-09-06，按天分类，动态分区的属性设置为：

  `time_unit="DAY/WEEK/MONTH", end=3, start=-3, reserved_history_periods="[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"`。

  则系统会自动保留：

  ```text
  ["2020-06-01","2020-06-20"],
  ["2020-10-31","2020-11-15"]
  ```

  或者

  `time_unit="HOUR", end=3, start=-3, reserved_history_periods="[2020-06-01 00:00:00,2020-06-01 03:00:00]"`.

  则系统会自动保留：

  ```text
  ["2020-06-01 00:00:00","2020-06-01 03:00:00"]
  ```

  这两个时间段的分区。其中，`reserved_history_periods` 的每一个 `[...,...]` 是一对设置项，两者需要同时被设置，且第一个时间不能大于第二个时间。


### 创建历史分区规则

当 `create_history_partition` 为 `true`，即开启创建历史分区功能时，SelectDB 会根据 `dynamic_partition.start` 和 `dynamic_partition.history_partition_num` 来决定创建历史分区的个数。

假设需要创建的历史分区数量为 `expect_create_partition_num`，根据不同的设置具体数量如下：

1. `create_history_partition` = `true`
   - `dynamic_partition.history_partition_num` 未设置，即 -1.
     `expect_create_partition_num` = `end` - `start`;
   - `dynamic_partition.history_partition_num` 已设置
     `expect_create_partition_num` = `end` - max(`start`, `-histoty_partition_num`);
2. `create_history_partition` = `false`
   不会创建历史分区，`expect_create_partition_num` = `end` - 0;

当 `expect_create_partition_num` 大于 `max_dynamic_partition_num`（默认500）时，禁止创建过多分区。

**举例说明：**

1. 假设今天是 2021-05-20，按天分区，动态分区的属性设置为：`create_history_partition=true, end=3, start=-3, history_partition_num=1`，则系统会自动创建以下分区：

   ```text
   p20210519
   p20210520
   p20210521
   p20210522
   p20210523
   ```

2. `history_partition_num=5`，其余属性与 1 中保持一直，则系统会自动创建以下分区：

   ```text
   p20210517
   p20210518
   p20210519
   p20210520
   p20210521
   p20210522
   p20210523
   ```

3. `history_partition_num=-1` 即不设置历史分区数量，其余属性与 1 中保持一直，则系统会自动创建以下分区：

   ```text
   p20210517
   p20210518
   p20210519
   p20210520
   p20210521
   p20210522
   p20210523
   ```

####  注意事项

动态分区使用过程中，如果因为一些意外情况导致 `dynamic_partition.start` 和 `dynamic_partition.end` 之间的某些分区丢失，那么当前时间与 `dynamic_partition.end` 之间的丢失分区会被重新创建，`dynamic_partition.start`与当前时间之间的丢失分区不会重新创建。

#### 示例

1. 表 tbl1 分区列 k1 类型为 DATE，创建一个动态分区规则。按天分区，只保留最近7天的分区，并且预先创建未来3天的分区。

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

   假设当前日期为 2020-05-29。则根据以上规则，tbl1 会产生以下分区：

   ```text
   p20200529: ["2020-05-29", "2020-05-30")
   p20200530: ["2020-05-30", "2020-05-31")
   p20200531: ["2020-05-31", "2020-06-01")
   p20200601: ["2020-06-01", "2020-06-02")
   ```

   在第二天，即 2020-05-30，会创建新的分区 `p20200602: ["2020-06-02", "2020-06-03")`

   在 2020-06-06 时，因为 `dynamic_partition.start` 设置为 7，则将删除7天前的分区，即删除分区 `p20200529`。

2. 表 tbl1 分区列 k1 类型为 DATETIME，创建一个动态分区规则。按星期分区，只保留最近2个星期的分区，并且预先创建未来2个星期的分区。

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

   假设当前日期为 2020-05-29，是 2020 年的第 22 周。默认每周起始为星期一。则根于以上规则，tbl1 会产生以下分区：

   ```text
   p2020_22: ["2020-05-25 00:00:00", "2020-06-01 00:00:00")
   p2020_23: ["2020-06-01 00:00:00", "2020-06-08 00:00:00")
   p2020_24: ["2020-06-08 00:00:00", "2020-06-15 00:00:00")
   ```

   其中每个分区的起始日期为当周的周一。同时，因为分区列 k1 的类型为 DATETIME，则分区值会补全时分秒部分，且皆为 0。

   在 2020-06-15，即第25周时，会删除2周前的分区，即删除 `p2020_22`。

   在上面的例子中，假设用户指定了周起始日为 `"dynamic_partition.start_day_of_week" = "3"`，即以每周三为起始日。则分区如下：

   ```text
   p2020_22: ["2020-05-27 00:00:00", "2020-06-03 00:00:00")
   p2020_23: ["2020-06-03 00:00:00", "2020-06-10 00:00:00")
   p2020_24: ["2020-06-10 00:00:00", "2020-06-17 00:00:00")
   ```

   即分区范围为当周的周三到下周的周二。

   - 注：2019-12-31 和 2020-01-01 在同一周内，如果分区的起始日期为 2019-12-31，则分区名为 `p2019_53`，如果分区的起始日期为 2020-01-01，则分区名为 `p2020_01`。

3. 表 tbl1 分区列 k1 类型为 DATE，创建一个动态分区规则。按月分区，不删除历史分区，并且预先创建未来2个月的分区。同时设定以每月3号为起始日。

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

   假设当前日期为 2020-05-29。则根于以上规则，tbl1 会产生以下分区：

   ```text
   p202005: ["2020-05-03", "2020-06-03")
   p202006: ["2020-06-03", "2020-07-03")
   p202007: ["2020-07-03", "2020-08-03")
   ```

   因为没有设置 `dynamic_partition.start`，则不会删除历史分区。

   假设今天为 2020-05-20，并设置以每月28号为起始日，则分区范围为：

   ```text
   p202004: ["2020-04-28", "2020-05-28")
   p202005: ["2020-05-28", "2020-06-28")
   p202006: ["2020-06-28", "2020-07-28")
   ```

### 修改动态分区属性

通过如下命令可以修改动态分区的属性：

```sql
ALTER TABLE tbl1 SET
(
    "dynamic_partition.prop1" = "value1",
    ...
);
```

某些属性的修改可能会产生冲突。假设之前分区粒度为 DAY，并且已经创建了如下分区：

```text
p20200519: ["2020-05-19", "2020-05-20")
p20200520: ["2020-05-20", "2020-05-21")
p20200521: ["2020-05-21", "2020-05-22")
```

如果此时将分区粒度改为 MONTH，则系统会尝试创建范围为 `["2020-05-01", "2020-06-01")` 的分区，而该分区的分区范围和已有分区冲突，所以无法创建。而范围为 `["2020-06-01", "2020-07-01")` 的分区可以正常创建。因此，2020-05-22 到 2020-05-30 时间段的分区，需要自行填补。

### 查看动态分区表调度情况

通过以下命令可以进一步查看当前数据库下，所有动态分区表的调度情况：

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

- LastUpdateTime: 最后一次修改动态分区属性的时间
- LastSchedulerTime: 最后一次执行动态分区调度的时间
- State: 最后一次执行动态分区调度的状态
- LastCreatePartitionMsg: 最后一次执行动态添加分区调度的错误信息
- LastDropPartitionMsg: 最后一次执行动态删除分区调度的错误信息

### 高级操作

#### 配置项

- dynamic_partition_enable

  是否开启动态分区功能。默认为 false，即关闭。该参数只影响动态分区表的分区操作，不影响普通表。可以在运行时执行以下命令生效：

  `ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true")`

  若要全局关闭动态分区，则设置此参数为 false 即可。

- dynamic_partition_check_interval_seconds

  动态分区线程的执行频率，默认为600(10分钟)，即每10分钟进行一次调度。可以在运行时执行以下命令修改：

  `ADMIN SET FRONTEND CONFIG ("dynamic_partition_check_interval_seconds" = "7200")`


  #### 动态分区表与手动分区表相互转换

  对于一个表来说，动态分区和手动分区可以自由转换，但二者不能同时存在，有且只有一种状态。

1. **手动分区转换为动态分区**

  如果一个表在创建时未指定动态分区，可以通过 `ALTER TABLE` 在运行时修改动态分区相关属性来转化为动态分区，具体示例可以通过 `HELP ALTER TABLE` 查看。

  开启动态分区功能后，将不再允许用户手动管理分区，会根据动态分区属性来自动管理分区。

  **注意**：如果已设定 `dynamic_partition.start`，分区范围在动态分区起始偏移之前的历史分区将会被删除。

2. **动态分区转换为手动分区**

  通过执行 `ALTER TABLE tbl_name SET ("dynamic_partition.enable" = "false")` 即可关闭动态分区功能，将其转换为手动分区表。

  关闭动态分区功能后，将不再自动管理分区，需要用户手动通过 `ALTER TABLE` 的方式创建或删除分区。


### 常见问题

1. 创建动态分区表后提示 `Could not create table with dynamic partition when fe config dynamic_partition_enable is false`

   由于动态分区的总开关  `dynamic_partition_enable` 为 false，导致无法创建动态分区表。

   执行命令 ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true") 将动态分区开关打开即可。

2. 关于动态分区的副本设置

   动态分区是由系统内部的调度逻辑自动创建的。在自动创建分区时，所使用的分区属性（包括分区的副本数等），都是单独使用 `dynamic_partition` 前缀的属性，而不是使用表的默认属性。举例说明：

   ```
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

   这个示例中，没有创建任何初始分区（PARTITION BY 子句中的分区定义为空），并且设置了 `DISTRIBUTED BY HASH(k1) BUCKETS 3`, `"replication_num" = "3"`, `"dynamic_partition.replication_num" = "1"` 和 `"dynamic_partition.buckets" = "32"`。

   我们将前两个参数成为表的默认参数，而后两个参数成为动态分区专用参数。

   当系统自动创爱分区时，会使用分桶数 32 和 副本数 1 这两个配置（即动态分区专用参数）。而不是分桶数 3 和 副本数 3 这两个配置。

   当用户通过 `ALTER TABLE tbl1 ADD PARTITION` 语句手动添加分区时，则会使用分桶数 3 和 副本数 3 这两个配置（即表的默认参数）。

   即动态分区使用一套独立的参数设置。只有当没有设置动态分区专用参数时，才会使用表的默认参数。如下：

   ```
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

   这个示例中，没有单独指定 `dynamic_partition.replication_num`，则动态分区会使用表的默认参数，即 `"replication_num" = "3"`。

   而如下示例：

   ```
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

   这个示例中，有一个手动创建的分区 p1。这个分区会使用表的默认设置，即分桶数 3 和副本数 3。而后续系统自动创建的动态分区，依然会使用动态分区专用参数，即分桶数 32 和副本数 1。
