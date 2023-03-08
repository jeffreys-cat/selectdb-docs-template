# S3 导入

当前SelectDB Cloud支持通过同一地域的对象存储进行内网导入

## 适用场景

- 源数据在 支持 S3 协议的存储系统中，如 S3,BOS,COS,OSS,OBS 等。
- 数据量在 几十到百 GB 级别。

## 准备工作

1. 准备 AK 和 SK，SelectDB Cloud 需要 AK 和 SK 在访问对象存储时进行验证
2. 准备 REGION 和 ENDPOINT REGION 可以在创建桶的时候选择也可以在桶列表中查看到。

**注意：** 对象存储的 REGION 要和SelectDB Cloud 在同一 REGION 才能进行内网导入

云存储系统可以相应的文档找到与 S3 兼容的相关信息。

## 开始导入

### 语法

```sql
LOAD LABEL load_label
(
    data_desc1[, data_desc2, ...]
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
)
PROPERTIES
();
```

- `load_label`

  每个导入需要指定一个唯一的 Label。后续可以通过这个 label 来查看作业进度。

  `[database.]label_name`

- `data_desc1`

  用于描述一组需要导入的文件。

  ```sql
  [MERGE|APPEND|DELETE]
  DATA INFILE
  (
  "file_path1"[, file_path2, ...]
  )
  [NEGATIVE]
  INTO TABLE `table_name`
  [PARTITION (p1, p2, ...)]
  [COLUMNS TERMINATED BY "column_separator"]
  [FORMAT AS "file_type"]
  [(column_list)]
  [COLUMNS FROM PATH AS (c1, c2, ...)]
  [PRECEDING FILTER predicate]
  [SET (column_mapping)]
  [WHERE predicate]
  [DELETE ON expr]
  [ORDER BY source_sequence]
  [PROPERTIES ("key1"="value1", ...)]
  ```

    - `[MERGE|APPEND|DELETE]`

      数据合并类型。默认为 APPEND，表示本次导入是普通的追加写操作。MERGE 和 DELETE 类型仅适用于 Unique Key 模型表。其中 MERGE 类型需要配合 `[DELETE ON]` 语句使用，以标注 Delete Flag 列。而 DELETE 类型则表示本次导入的所有数据皆为删除数据。

    - `DATA INFILE`

      指定需要导入的文件路径。可以是多个。可以使用通配符。路径最终必须匹配到文件，如果只匹配到目录则导入会失败。

    - `NEGTIVE`

      该关键词用于表示本次导入为一批”负“导入。这种方式仅针对具有整型 SUM 聚合类型的聚合数据表。该方式会将导入数据中，SUM 聚合列对应的整型数值取反。主要用于冲抵之前导入错误的数据。

    - `PARTITION(p1, p2, ...)`

      可以指定仅导入表的某些分区。不再分区范围内的数据将被忽略。

    - `COLUMNS TERMINATED BY`

      指定列分隔符。仅在 CSV 格式下有效。仅能指定单字节分隔符。

    - `FORMAT AS`

      指定文件类型，支持 CSV、PARQUET 和 ORC 格式。默认为 CSV。

    - `column list`

      用于指定原始文件中的列顺序。关于这部分详细介绍，可以参阅 [列的映射，转换与过滤](../../../../../data-operate/import/import-scenes/load-data-convert) 文档。

      `(k1, k2, tmpk1)`

    - `COLUMNS FROM PATH AS`

      指定从导入文件路径中抽取的列。

    - `PRECEDING FILTER predicate`

      前置过滤条件。数据首先根据 `column list` 和 `COLUMNS FROM PATH AS` 按顺序拼接成原始数据行。然后按照前置过滤条件进行过滤。关于这部分详细介绍，可以参阅 [列的映射，转换与过滤](../../../../../data-operate/import/import-scenes/load-data-convert) 文档。

    - `SET (column_mapping)`

      指定列的转换函数。

    - `WHERE predicate`

      根据条件对导入的数据进行过滤。关于这部分详细介绍，可以参阅 [列的映射，转换与过滤](../../../../../data-operate/import/import-scenes/load-data-convert) 文档。

    - `DELETE ON expr`

      需配合 MEREGE 导入模式一起使用，仅针对 Unique Key 模型的表。用于指定导入数据中表示 Delete Flag 的列和计算关系。

    - `ORDER BY`

      仅针对 Unique Key 模型的表。用于指定导入数据中表示 Sequence Col 的列。主要用于导入时保证数据顺序。

    - `PROPERTIES ("key1"="value1", ...)`

      指定导入的format的一些参数。如导入的文件是`json`格式，则可以在这里指定`json_root`、`jsonpaths`、`fuzzy_parse`等参数。

- `PROPERTIES`

  指定导入的相关参数。目前支持以下参数：

    - `timeout`

      导入超时时间。默认为 4 小时。单位秒。

    - `max_filter_ratio`

      最大容忍可过滤（数据不规范等原因）的数据比例。默认零容忍。取值范围为 0 到 1。

    - `exec_mem_limit`

      导入内存限制。默认为 2GB。单位为字节。

    - `strict_mode`

      是否对数据进行严格限制。默认为 false。

    - `timezone`

      指定某些受时区影响的函数的时区，如 `strftime/alignment_timestamp/from_unixtime` 等等，具体请查阅 [时区](../../../../../advanced/time-zone) 文档。如果不指定，则使用 "Asia/Shanghai" 时区

    - `load_parallelism`

      导入并发度，默认为1。调大导入并发度会启动多个执行计划同时执行导入任务，加快导入速度。

    - `send_batch_parallelism`

      用于设置发送批处理数据的并行度，如果并行度的值超过 BE 配置中的 `max_send_batch_parallelism_per_job`，那么作为协调点的 BE 将使用 `max_send_batch_parallelism_per_job` 的值。

    - `load_to_single_tablet`

      布尔类型，为true表示支持一个任务只导入数据到对应分区的一个tablet，默认值为false，作业的任务数取决于整体并发度。该参数只允许在对带有random分区的olap表导数的时候设置。

### 举例

```sql
    LOAD LABEL example_db.exmpale_label_1
    (
        DATA INFILE("s3://your_bucket_name/your_file.txt")
        INTO TABLE load_test
        COLUMNS TERMINATED BY ","
    )
    WITH S3
    (
        "AWS_ENDPOINT" = "AWS_ENDPOINT",
        "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
        "AWS_SECRET_KEY"="AWS_SECRET_KEY",
        "AWS_REGION" = "AWS_REGION"
    )
    PROPERTIES
    (
        "timeout" = "3600"
    );
```

## 常见问题

S3 SDK 默认使用 virtual-hosted style 方式。但某些对象存储系统可能没开启或没支持 virtual-hosted style 方式的访问，此时我们可以添加 `use_path_style` 参数来强制使用 path style 方式：

```sql
  WITH S3
  (
        "AWS_ENDPOINT" = "AWS_ENDPOINT",
        "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
        "AWS_SECRET_KEY"="AWS_SECRET_KEY",
        "AWS_REGION" = "AWS_REGION",
        "use_path_style" = "true"
  )
```