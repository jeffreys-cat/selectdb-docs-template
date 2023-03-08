# S3 Import

Currently SelectDB Cloud supports data import through object storage in the same region

## Applicable scene

- The source data is in a storage system that supports the S3 protocol, such as AWS S3,  Alibaba Cloud OSS, etc.
- The amount of data ranges from tens to hundreds of GB.

## Preparation

1. Get AK and SK of object storage, SelectDB Cloud needs AK and SK to verify when accessing object storage
2. Know REGION and ENDPOINT of object storage, REGION can be selected when creating a bucket or can be viewed in the bucket list.

**Note:** The REGION of the object storage must be in the same REGION as SelectDB Cloud for intranet import

The cloud storage system can find relevant information compatible with S3 in corresponding documents.

## Start data import

### Grammar

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

  Each import needs to specify a unique Label. Later, you can use this label to view the progress of the job.

  `[database.]label_name`

- `data_desc1`

  Used to describe a set of files that need to be imported.

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

    Data merge type. The default is APPEND, which means that this import is an ordinary append operation. The MERGE and DELETE types are only available for Unique Key model tables. Among them, the MERGE type needs to be used with the `[DELETE ON]`statement to mark the Delete Flag column. The DELETE type means that all the data imported this time are deleted data.

  - `DATA INFILE`

    Specify the file path to import. Can be multiple. Wildcards can be used. The path must eventually match a file, and the import will fail if it matches only a directory.

  - `NEGTIVE`

    This keyword is used to indicate that this import is a batch of "negative" imports. This method is only for aggregation data tables with integer SUM aggregation type. This method will reverse the integer value corresponding to the SUM aggregation column in the imported data. It is mainly used to offset the wrong data imported before.

  - `PARTITION(p1, p2, ...)`

    You can specify to import only certain partitions of a table. Data that is no longer within the partition range will be ignored.

  - `COLUMNS TERMINATED BY`

    Specifies the column separator. Valid only in CSV format. Only single-byte delimiters can be specified.

  - `FORMAT AS`

    Specify the file type, CSV, PARQUET and ORC formats are supported. The default is CSV.

  - `column list`

    Used to specify the column order in the original file. 

    `(k1, k2, tmpk1)`

  - `COLUMNS FROM PATH AS`

    Specifies the columns to extract from the import file path.

  - `PRECEDING FILTER predicate`

    Pre-filter conditions. The data is `column list`first `COLUMNS FROM PATH AS`spliced into raw data rows sequentially according to and . Then filter according to the pre-filter conditions.

  - `SET (column_mapping)`

    Specifies the conversion function for the column.

  - `WHERE predicate`

    Filter the imported data based on conditions.

  - `DELETE ON expr`

    It needs to be used together with the MEREGE import mode, only for tables of the Unique Key model. It is used to specify the column and calculation relationship representing Delete Flag in the imported data.

  - `ORDER BY`

    Only for tables with Unique Key models. It is used to specify the column representing Sequence Col in the imported data. It is mainly used to ensure the data order when importing.

  - `PROPERTIES ("key1"="value1", ...)`

    Specify some parameters of the imported format. If the imported file is `json`format, you can specify parameters such as `json_root`, `jsonpaths`, `fuzzy_parse`and so on here.

- `PROPERTIES`

  Specify the relevant parameters for import. The following parameters are currently supported:

  - `timeout`

    Import timeout. The default is 4 hours. The unit is second.

  - `max_filter_ratio`

    The maximum tolerable data ratio that can be filtered (for reasons such as data irregularity). The default is zero tolerance. Values range from 0 to 1.

  - `exec_mem_limit`

    Import memory limit. The default is 2GB. The unit is bytes.

  - `strict_mode`

    Whether to impose strict restrictions on the data. The default is false.

  - `timezone`

    Specify the time zone of some functions affected by time zone, such as `strftime/alignment_timestamp/from_unixtime`etc. . If not specified, the "Asia/Shanghai" time zone is used

  - `load_parallelism`

    Import concurrency, the default is 1. Increasing the import concurrency will start multiple execution plans to execute import tasks at the same time, speeding up the import.

  - `send_batch_parallelism`

    It is used to set the parallelism of sending batch data. If the parallelism value exceeds the BE configuration, the `max_send_batch_parallelism_per_job`BE as the coordination point will use `max_send_batch_parallelism_per_job`the value of .

  - `load_to_single_tablet`

    Boolean type, if it is true, it means that a task can only import data to a tablet of the corresponding partition. The default value is false, and the number of tasks of the job depends on the overall concurrency. This parameter is only allowed to be set when the derivative of the olap table with random partition is used.

### Example

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



## Frequently asked questions

The S3 SDK uses the virtual-hosted style by default. However, some object storage systems may not be enabled or support virtual-hosted style access. At this time, we can add `use_path_style`parameters to force the use of path style:

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
