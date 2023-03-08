# Stage Import

Currently SelectDB Cloud supports two stage import methods:

- Batch pull and import is performed by creating a stage on the object storage. This is mainly suitable for large-scale data import. The premise is that the user has his own object storage and its key.
- Based on the push import of the built-in stage, this is mainly suitable for small batch push, and it is easy to use.

## Create external stage

Create an external stage for importing data files into SelectDB Cloud tables.

Suggestion: Users can create a sub-account dedicated to data import, and use the bucket policy to grant the sub-account the read permission of a specific prefix, so that SelectDB Cloud can read the object data source to be imported.

### Grammar

```text
CREATE STAGE [IF NOT EXISTS] <stage_name> PROPERTIES (
    {stage_properties}
)
```



- `stage_properties`

  Specify stage-related parameters. The following parameters are currently supported:

  - `endpoint`

    object storage `Endpoint`. required.

  - `region`

    object storage `Region`. required.

  - `bucket`

    object storage `Bucket`. required.

  - `prefix`

    `Bucket`The prefix path of user data files under this . Not required, defaults to `Bucket`the root path under.

  - `provider`

    Specifies the cloud provider that provides object storage. required. Currently supported:

    - `OSS`:Alibaba Cloud
    - `COS`: Tencent Cloud
    - `OBS`: Huawei Cloud
    - `S3`: AWS

  - `ak`

    object storage `Access Key ID`. required.

  - `sk`

    object storage `Secret Access Key`. required.

  - `default.file.type`

    The default type of the stage storage file, currently supports `csv`, `json`, `orc`, `parquet`. Not required, this parameter can be overridden when importing.

  - `default.file.compression`

    The default compression type of the stage storage file, currently supports `gz`, `bz2`, `lz4`, `lzo`, `deflate`. Not required, this parameter can be overridden when importing.

  - `default.file.column_separator`

    The default column separator of the stage storage file, default `\t`. Not required, this parameter can be overridden when importing.

  - `default.file.line_delimiter`

    The default line separator of the stage storage file, default `\n`. Not required, this parameter can be overridden when importing.

  - `default.copy.size_limit`

    When importing files under this stage, the default import size is in Byte, and the default is unlimited. Not required, this parameter can be overridden when importing.

  - `default.copy.on_error`

    When importing files under this stage, when the data quality is not up to standard, the default error handling method. Not required, this parameter can be overridden when importing. Currently supported:

    - `max_filter_ratio_{number}`: Set the maximum error rate `{number}`, where, `{number}`is `[0-1]`, a floating-point number in the interval. If the error rate of the imported data is below the threshold, those erroneous rows will be ignored and other correct data will be imported.

      - `abort_statement`: When the data has error rows, break the import, equivalent to `max_filter_ratio_0`. default behavior
      - `continue`: Ignore the wrong line, import the correct line, equivalent to`max_filter_ratio_1`

  - `default.copy.strict_mode`

    For strict filtering of column type conversion during the import process, refer to Doris's import strict mode. Default is `false`. Not required, this parameter can be overridden when importing.

### Example

1. Create `test_stage`a stage named:

```text
CREATE STAGE test_stage PROPERTIES (
    'endpoint' = 'cos.ap-beijing.myqcloud.com',
    'region' = 'ap-beijing',
    'bucket' = 'selectdb_test',
    'prefix' = 'test_stage',
    'provider' = 'cos',
    'ak' = 'XX',
    'sk' = 'XX'
)
```

2. Create `test_stage`a stage named , specifying the default file type and column separator:

```text
CREATE STAGE test_stage PROPERTIES (
    'endpoint' = 'cos.ap-beijing.myqcloud.com',
    'region' = 'ap-beijing',
    'bucket' = 'selectdb_test',
    'prefix' = 'test_stage',
    'provider' = 'cos',
    'ak' = 'XX',
    'sk' = 'XX',
    'default.file.type' = 'csv',
    'default.file.column_separator' = ','
)
```



## Other operations

### SHOW STAGES

Display all external stage information that the logged-in user has permission to access, including `name` ,`id `,`endpoint `,`region `,`bucket `,`prefix `,`ak `,`sk `and default properties.

**example**

```text
mysql> SHOW STAGES;
+----------------------------+--------------------------------------+-----------------------------+------------+------------------------+---------------------+--------------------------------------+----------------------------------+----------+-----------------------------------------------------------------+
| StageName                  | StageId                              | Endpoint                    | Region     | Bucket                 | Prefix              | AK                                   | SK                               | Provider | DefaultProperties                                               |
+----------------------------+--------------------------------------+-----------------------------+------------+------------------------+---------------------+--------------------------------------+----------------------------------+----------+-----------------------------------------------------------------+
| regression_test_copy_stage | e8ed6ea0-33c8-4381-b7a9-c19ea1801bca | cos.ap-beijing.myqcloud.com | ap-beijing | doris-build-1308700295 | regression/tpch/sf1 | AKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | COS      | {"default.file.column_separator":"|"}                           |
| root_stage                 | 8b8329de-be1a-40a8-9eab-91d31f9798bf | cos.ap-beijing.myqcloud.com | ap-beijing | justtmp-bj-1308700295  |                     | AKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | COS      | {"default.file.type":"CSV","default.file.column_separator":","} |
| admin_stage                | 9284a9ec-3ba7-47b9-b276-1ccde875469c | cos.ap-beijing.myqcloud.com | ap-beijing | justtmp-bj-1308700295  | meiyi_cloud_test    | AKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | COS      | {"default.file.column_separator":",","default.file.type":"CSV"} |
+----------------------------+--------------------------------------+-----------------------------+------------+------------------------+---------------------+--------------------------------------+----------------------------------+----------+-----------------------------------------------------------------+
3 rows in set (0.15 sec)
```



### DROP STAGE

To delete the external stage, the user needs to have the ADMIN authority of the stage

**grammar**

```text
DROP STAGE [IF EXISTS] <stage_name>
```



**example**

Delete `test_stage`the stage named:

```text
DROP STAGE test_stage
```



## GRANT STAGE and REVOKE

Issues related to user access to external stage permissions in the storage-computing separation version

Note: The user names mentioned in this document are all sql user names, such as mysql -ujack, where jack is the user name

### Grant stage access rights to users

1. create a new user using mysql client
2. grammar
```text
GRANT USAGE_PRIV ON STAGE {stage_name} TO {user}
```
3. example

```text
// create user jack
mysql> CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

mysql> GRANT USAGE_PRIV ON STAGE not_exist_stage TO jack;
Query OK, 0 rows affected (0.01 sec)

mysql> show all grants;
+--------------+----------+-------------------------------+--------------+---------------------------------------------------+------------+---------------+--------------+--------------------------------------+
| UserIdentity | Password | GlobalPrivs                   | CatalogPrivs | DatabasePrivs                                     | TablePrivs | ResourcePrivs | CloudCluster | CloudStage                           |
+--------------+----------+-------------------------------+--------------+---------------------------------------------------+------------+---------------+--------------+--------------------------------------+
| 'jack'@'%'   | Yes      |  (false)                      | NULL         | internal.information_schema: Select_priv  (false) | NULL       | NULL          | NULL         | not_exist_stage: Usage_priv  (false) |
| 'root'@'%'   | No       | Node_priv Admin_priv  (false) | NULL         | NULL                                              | NULL       | NULL          | NULL         | NULL                                 |
| 'admin'@'%'  | No       | Admin_priv  (false)           | NULL         | NULL                                              | NULL       | NULL          | NULL         | NULL                                 |                             |
+--------------+----------+-------------------------------+--------------+---------------------------------------------------+------------+---------------+--------------+--------------------------------------+
3 rows in set (0.00 sec)
```



### revoke user access stage permissions

1. grammar
```text
REVOKE USAGE_PRIV ON STAGE {stage_name} FROM {user}
```
2. example:

```text
// create user jack
mysql> revoke USAGE_PRIV ON STAGE not_exist_stage FROM jack;
Query OK, 0 rows affected (0.01 sec)

mysql> show all grants;
+--------------+----------+-------------------------------+--------------+---------------------------------------------------+------------+---------------+--------------+------------+
| UserIdentity | Password | GlobalPrivs                   | CatalogPrivs | DatabasePrivs                                     | TablePrivs | ResourcePrivs | CloudCluster | CloudStage |
+--------------+----------+-------------------------------+--------------+---------------------------------------------------+------------+---------------+--------------+------------+
| 'root'@'%'   | No       | Node_priv Admin_priv  (false) | NULL         | NULL                                              | NULL       | NULL          | NULL         | NULL       |
| 'admin'@'%'  | No       | Admin_priv  (false)           | NULL         | NULL                                              | NULL       | NULL          | NULL         | NULL       |
| 'jack'@'%'   | Yes      |  (false)                      | NULL         | internal.information_schema: Select_priv  (false) | NULL       | NULL          | NULL         | NULL       |
+--------------+----------+-------------------------------+--------------+---------------------------------------------------+------------+---------------+--------------+------------+
3 rows in set (0.00 sec)
```



## COPY INTO

Import the data files in the stage into the table of SelectDB.

Note: A file with the same name and content under a stage can only be imported into a table once, and cannot be imported repeatedly.

### Grammar

```text
COPY INTO [<db_name>.]<table_name> FROM {copy_from_param} PROPERTIES (
    {copy_into_properties}
)
```

- `copy_from_param`

  Specifies the imported stage name, file, column conversion, mapping, filtering rules, etc.

  ```text
  copy_from_param ::=
      {stage_and_glob}
    | ( SELECT {copy_select_expr_list} FROM {stage_and_glob} {copy_where_expr_list} )
  ```

  ```text
  stage_and_glob ::=
      @{stage_name}
    | @{stage_name}('{file_glob}')
  ```
  
  `stage_name`

  - External stage name created by the user
  - The default internal stage belonging to the user, named`~`
  
  `file_glob`
  
  - Use the glob syntax to specify the files that need to be imported

  `copy_select_expr_list`

  - Perform column conversion, mapping, etc. Mapping with different columns of the target table can be achieved by adjusting the column order of the input data source (note: only the entire row can be mapped):

    ```text
    copy_select_expr_list ::=
        *
      | { $<file_col_num> | <expr> }[ , ... ]
    ```
  
    `file_col_num`
  
    - The serial numbers listed in the import file separated by the specified delimiter (such as `1`column 1)

    `expr`

    - Specify an expression, such as arithmetic operations, etc.

```
copy_where_expr_list
```

- Filter the columns in the file according to the expression, and the filtered rows will not be imported into the table

  ```text
  copy_where_expr_list ::=
      WHERE <predicate_expr>
  ```

- `copy_into_properties`

  Specify the parameters related to CopyInto. The following parameters are currently supported:

  - `file.type`

    The type of the imported file, currently supports `csv`, `json`, `orc`, `parquet`.

    Not required. If not set, the default file type configured by the stage will be used first; if not set on the stage, the system will automatically infer the type.

  - `file.compression`

    The compression type of the imported file, currently supports `gz`, `bz2`, `lz4`, `lzo`, `deflate`.

    Not required. If not set, the default compression type configured by the stage will be used first; if not set on the stage, the system will automatically infer the type.

  - `file.column_separator`

    The column separator for the imported file.

    Not required. If not set, the default column separator configured by the stage will be used first; if not set on the stage, the system default value will be used `\t`.

  - `file.line_delimiter`

    Line separator for imported files.

    Not required. If not set, the default line separator configured by the stage will be used first; if not set on the stage, the system default value will be used `\n`.

  - `copy.size_limit`

    Imported file size, the unit is Byte. If the matching files to be imported exceed the size limit, only some of the files meeting the size limit will be imported.

    Not required. If not set, the default import size configured by the stage is preferred; if not set on the stage, there is no limit by default.

  - `copy.on_error`

    When importing, the error handling method when the data quality is not up to standard. Currently supported:

    - `max_filter_ratio_{number}`: Set the maximum error rate `{number}`, where, `{number}`is `[0-1]`a floating-point number in the interval. If the error rate of the imported data is below the threshold, those erroneous rows will be ignored and other correct data will be imported.
    - `abort_statement`: When the data has error rows, break the import, equivalent to `max_filter_ratio_0`. default behavior
    - `continue`: Ignore the wrong line, import the correct line, equivalent to`max_filter_ratio_1`

    Not required. If not set, the default error handling policy configured by the stage will be used first; if not set on the stage, the system default policy will be used.

  - `copy.async`

    Whether the import is performed asynchronously. support `true`, `false`. The default value `true`is asynchronous execution, by `show copy`viewing the copy task executed asynchronously.

  - `copy.strict_mode`

    For strict filtering of column type conversion during the import process, refer to Doris's import strict mode. Default is `false`.

    Not required. If not set, the default mode of the stage configuration will be used first; if not set on the stage, the system default policy will be used.

### Output

Copy into is executed asynchronously by default and returns one `queryId`, such as:

```text
mysql> copy into db.t1 from @exs('2.csv');
+-----------------------------------+---------+------+------+------------+------------+--------------+------+
| id                                | state   | type | msg  | loadedRows | filterRows | unselectRows | url  |
+-----------------------------------+---------+------+------+------------+------------+--------------+------+
| 8fcf20b156dc4f66_99aa062042941aff | PENDING |      |      |            |            |              |      |
+-----------------------------------+---------+------+------+------------+------------+--------------+------+
1 row in set (0.14 sec)
```

According to `id`, use the `SHOW COPY`command to query the execution result:

```text
mysql> SHOW COPY WHERE id = '8fcf20b156dc4f66_99aa062042941aff';
+-----------------------------------+-------+----------------------------------------+----------+---------------------+------+-----------------------------------------------------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------+--------------+-------------------------------------------------------+
| Id                                | JobId | Label                                  | State    | Progress            | Type | EtlInfo                                             | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                                                                                                               | TransactionId    | ErrorTablets | Files                                                 |
+-----------------------------------+-------+----------------------------------------+----------+---------------------+------+-----------------------------------------------------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------+--------------+-------------------------------------------------------+
| 8fcf20b156dc4f66_99aa062042941aff | 17012 | copy_f8a124900f7d42f6_91dad473d45a34bd | FINISHED | ETL:100%; LOAD:100% | COPY | unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2 | cluster:N/A; timeout(s):14400; max_filter_ratio:0.0 | NULL     | 2022-10-21 09:06:48 | 2022-10-21 09:06:54 | 2022-10-21 09:06:54 | 2022-10-21 09:06:54 | 2022-10-21 09:06:55 | NULL | {"Unfinished backends":{"3e2fc170198240c0-929be46e8ca47838":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":30,"All backends":{"3e2fc170198240c0-929be46e8ca47838":[10003]},"FileNumber":1,"FileSize":14} | 6141324627542016 | {}           | ["s3://justtmp-bj-1308700295/meiyi_cloud_test/2.csv"] |
+-----------------------------------+-------+----------------------------------------+----------+---------------------+------+-----------------------------------------------------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------+--------------+-------------------------------------------------------+
1 row in set (0.01 sec)
```

Among them, `files`the files imported by this Copy task are listed.

### Example

- Import the data in the stage named `ext_stage`into the table`test_table`

  ```text
  COPY INTO test_table FROM @ext_stage
  ```

  The system will automatically scan `test_table`some files under the stage that are not imported into the table and import them

- `ext_stage`Import the data file in the stage named into `1.csv`the table`test_table`

  ```text
  COPY INTO test_table FROM @ext_stage('1.csv')
  ```

- `ext_stage`Import the data file in the stage named into `dir1/subdir_2/1.csv`the table`test_table`

  If the prefix is empty when creating `ext_stage`, the import statement is:

  ```text
  COPY INTO test_table FROM @ext_stage('dir1/subdir_2/1.csv')
  ```

  If `ext_stage`the prefix is `dir1`, then the import statement is:

  ```text
COPY INTO test_table FROM @ext_stage('subdir_2/1.csv')
  ```
  
  If `ext_stage`the prefix is `dir1/subdir_2`, then the import statement is:

  ```text
COPY INTO test_table FROM @ext_stage('1.csv')
  ```

- Import the file ending under the path in the named `ext_stage`stage into the table`dir1/subdir_2/``.csv``test_table`

  If the prefix is empty when creating `ext_stage`, the import statement is:

  ```text
  COPY INTO test_table FROM @ext_stage('dir1/subdir_2/*.csv')
  ```

  If `ext_stage`the prefix is `dir1`, then the import statement is:

  ```text
COPY INTO test_table FROM @ext_stage('subdir_2/*.csv')
  ```
  
  If `ext_stage`the prefix is `dir1/subdir_2`, then the import statement is:

  ```text
COPY INTO test_table FROM @ext_stage('*.csv')
  ```

- Import the files ending in subdirectories at all levels under the directory named `ext_stage`stage into the table`dir1``.csv``test_table`

  ```text
  COPY INTO test_table FROM @ext_stage('dir1/**.csv')
  ```

- `ext_stage`Import the data file in the named stage `1.csv`into the table `test_table`, and specify the column delimiter of the file as `,`, and the row delimiter as `\n`:

  ```text
  COPY INTO test_table FROM @ext_stage('1.csv') PROPERTIES (
      'file.column_separator' = ',',
      'file.line_delimiter' = '\n'
  )
  ```

- `ext_stage`Import the data file in the named stage `1.csv`into the table `test_table`, and specify synchronous execution:

  ```text
  COPY INTO test_table FROM @ext_stage('1.csv') PROPERTIES (
      'copy.async' = 'false'
  )
  ```

- Import the data files in the user's default internal stage `1.csv`into the table`test_table`

  ```text
  COPY INTO test_table FROM @~('1.csv')
  ```

- Column mapping, conversion, filtering, etc.

  If the file has 3 columns, respectively `$1`(column 1), `$2`(column 2), `$3`(column 3), import them into the three columns of the table: `id`, `name`, `score`ie `$1`$\rightarrow$ `id`, `$2`$\rightarrow$ `name`, `$3`$\ rightarrow$ `score`, the following statements are equivalent:

  ```text
  COPY INTO test_table FROM (SELECT * FROM @ext_stage('1.csv'))
  COPY INTO test_table FROM (SELECT $1, $2, $3 FROM @ext_stage('1.csv'))
  ```

  If the file has 4 columns, respectively `$1`(column 1), `$2`(column 2), `$3`(column 3), `$4`(column 4), import columns 1, 3, and 4 into the three columns of the table: `id`, `name`, `score`， That is, `$1`$\rightarrow$ `id`, `$3`$\rightarrow$ `name`, `$4`$\rightarrow$ `score`:

  ```text
  COPY INTO test_table FROM (SELECT $1, $3, $4 FROM @ext_stage('1.csv'))
  ```
  
  If the file has 2 columns, namely `$1`(column 1), `$2`(column 2), import them into the first two columns of the table respectively: `id`, `name`, `score`use the default value of the table or `NULL`, that is, `$1`$\rightarrow$ `id`, `$2`$\rightarrow$ `name`, `NULL`$ \rightarrow$`score`

  ```text
  COPY INTO test_table FROM (SELECT $1, $2, NULL FROM @ext_stage('1.csv'))
  ```

  If the file has 3 columns, namely `$1`(column 1), `$2`(column 2), `$3`(column 3), import columns 1, 3, and 2 into the three columns of the table: `id`, `name`, `score`ie `$1`$\rightarrow$ `id`, `$3`$\rightarrow$ `name`, `$2`$\rightarrow$ `score`:
  
  ```text
  COPY INTO test_table FROM (SELECT $1, $3, $2 FROM @ext_stage('1.csv'))
  ```

  If the file has 3 columns, respectively `$1`(column 1), `$2`(column 2), `$3`(column 3), filter out the third column greater than `60`, and then import to the three columns of the table: `id`, `name`, `score`:

  ```text
  COPY INTO test_table FROM (SELECT $1, $2, $3 FROM @ext_stage('1.csv') WHERE $3 > 60)
  ```

  If the file has 3 columns, namely `$1`(column 1), `$2`(column 2), `$3`(column 3), the third column is uniformly added `10`, and then imported into the three columns of the table: `id`, `name`, `score`:

  ```text
  COPY INTO test_table FROM (SELECT $1, $2, $3 + 10 FROM @ext_stage('1.csv'))
  ```
  
  If the file has 3 columns, respectively `$1`(column 1), `$2`(column 2), `$3`(column 3), filter out the ones that are smaller than `60`the third column, add them separately `10`, and then import them into the three columns of the table: `id`, `name`, `score`:

  ```text
  COPY INTO test_table FROM (SELECT $1, $2, $3 + 10 FROM @ext_stage('1.csv') WHERE $3 < 60)
  ```

  If the file has 3 columns, respectively `$1`(column 1), `$2`(column 2), `$3`(column 3), intercept the string in the second column, and then import it into the three columns of the table: `id`, `name`, `score`:
  
  ```text
  COPY INTO test_table FROM (SELECT $1, substring($2, 2), $3 FROM @ext_stage('1.csv'))
  ```

  

## Push import through built-in stage

If the user does not have an external object storage, the data file can be temporarily stored in the default object storage provided by SelectDB, which is called internal stage.

Different from external stage:

1. The internal stage does not need to be created manually, it will be created automatically when the user uses it for the first time. The name is fixed as `~`;
2. It can only be accessed by the current owner, and does not support grant permissions to other users;
3. The list cannot be performed, and the user needs to remember which files have been uploaded;

Then call the import statement copy into to import the file into the table.

### Grammar

upload files:

```text
curl -u {user}:{password} -H "fileName: {file_name_in_storage}" -T {local_file_path} -L '{selectdb_host}:{selectdb_copy_port}/copy/upload'
```

Import the file into the SelectDB table (note: the content of the request body is in `json`format, and some characters in the sql need to be escaped):

```text
curl -X POST -u {user}:{password} '{selectdb_host}:{selectdb_copy_port}/copy/query'  -H "Content-Type: application/json" -d '{"sql": "{copy_into_sql}"}'
```

### Example

User user1 `data/2022-10-20/1.csv`uploads a local file to the internal stage, and the uploaded file is named `2020/1.csv`:

```text
curl -u user1:passwd -H "fileName: 2022-10-20/1.csv" -T data/2022-10-20/1.csv -L '172.21.21.12:8035/copy/upload'
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0    14    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100    14    0     0  100    14      0     28 --:--:-- --:--:-- --:--:--    28
```

Execute the import:

```text
curl -X POST -u user1:password '172.21.21.12:8035/copy/query'  -H "Content-Type: application/json" -d '{"sql": "copy into db1.t5 from @~(\"2022-10-20/1.csv\")"}'
```



[
](https://cn-selectdb-com.translate.goog/cloud-docs/使用指南/数据导入/S3导入?_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp)