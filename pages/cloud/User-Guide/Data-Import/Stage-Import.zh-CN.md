# Stage导入

当前SelectDB Cloud支持两种Stage导入方式：
- 通过创建对象存储上的stage来进行批量拉取导入，这个主要适合大批量数据导入，使用前提是用户有自己的对象存储，及其密钥。
- 基于内置stage的推送导入，这个主要适合小批量推送，使用简单。

## 创建External Stage

创建一个external stage，用于将其中的数据文件导入到SelectDB的表中.

建议：用户可以建立一个专门用于数据导入的子账号，使用bucket policy授予该子账号特定prefix的读权限，便于SelectDB读取需要导入的对象数据源。

### 语法

```
CREATE STAGE [IF NOT EXISTS] <stage_name> PROPERTIES (
    {stage_properties}
)
```

- `stage_properties`

  指定stage相关的参数。目前支持以下参数：

    - `endpoint`

      对象存储的`Endpoint`。必需。

    - `region`

      对象存储的`Region`。必需。

    - `bucket`

      对象存储的`Bucket`。必需。

    - `prefix`

      用户数据文件在该`Bucket`下的前缀路径。非必需，默认为`Bucket`下的根路径。

    - `provider`

      指定提供对象存储的云厂商。必需。目前支持:
      - `OSS`：阿里云
      - `COS`：腾讯云
      - `OBS`：华为云
      - `S3`：亚马逊云
      
  - `ak`
  
    对象存储的`Access Key ID`。必需。
  
  - `sk`
  
    对象存储的`Secret Access Key`。必需。
  
  - `default.file.type`
  
    该stage存储文件的默认类型，目前支持`csv`,`json`,`orc`,`parquet`。非必需，导入时可覆盖该参数。
  
  - `default.file.compression`
  
    该stage存储文件的默认压缩类型，目前支持`gz`,`bz2`,`lz4`,`lzo`,`deflate`。非必需，导入时可覆盖该参数。
  
  - `default.file.column_separator`
  
    该stage存储文件的默认列分隔符，默认`\t`。非必需，导入时可覆盖该参数。
  
  - `default.file.line_delimiter`
  
    该stage存储文件的默认行分隔符，默认`\n`。非必需，导入时可覆盖该参数。
  
  - `default.copy.size_limit`
  
    导入该stage下的文件时，默认的导入大小，单位为Byte，默认为不限制。非必需，导入时可覆盖该参数。
  
  - `default.copy.on_error`
  
    导入该stage下的文件时，当数据质量不合格时，默认的错误处理方式。非必需，导入时可覆盖该参数。目前支持:
  
    - `max_filter_ratio_{number}`：设置最大错误率为`{number}`，其中，`{number}`为`[0-1]`区间的浮点数。如果导入的数据的错误率低于阈值，则这些错误行将被忽略，其他正确的数据将被导入。
      - `abort_statement`：当数据有错误行时，中断导入，等价于`max_filter_ratio_0`。默认行为
      - `continue`：忽略错误行，导入正确行，等价于`max_filter_ratio_1`
  
  - `default.copy.strict_mode`
  
    对于导入过程中的列类型转换进行严格过滤，参考Doris的导入严格模式。默认为`false`。非必需，导入时可覆盖该参数。

### 举例

1. 创建名为`test_stage`的stage:

```
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

2. 创建名为`test_stage`的stage，并指定默认的文件类型和列分隔符：

```
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

## External Stage其他相关操作

### SHOW STAGES

展示登录用户有权限访问的全部external stage信息，包括name`,`id`,`endpoint`,`region`,`bucket`,`prefix`,`ak`,`sk`和默认的参数`defaultProperties`。

**举例**

```
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

删除external stage，用户需要有stage的ADMIN权限

**语法**

```
DROP STAGE [IF EXISTS] <stage_name>
```

**举例**

删除名为`test_stage`的stage:
```
DROP STAGE test_stage
```



## GRANT STAGE 和 REVOKE STAGE

在存算分离版本用户访问external stage权限相关问题

注意：此文档说的用户名，都是sql的用户名，比如mysql -ujack，其中jack为用户名

### grant stage访问权限给用户

1. 使用mysql client创建一个新用户
2. 语法
```
GRANT USAGE_PRIV ON STAGE {stage_name} TO {user}
```

3. 示例：
```
// 使用root账号在mysql client中创建jack用户
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

### revoke 用户访问stage权限

1. 语法
```
REVOKE USAGE_PRIV ON STAGE {stage_name} FROM {user}
```

2. 示例：
```
// 使用root账号在mysql client中创建jack用户
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

将stage中的数据文件导入到SelectDB的表中.

注意：一个stage下同名且相同内容的文件只能导入到一个table中一次，不能重复导入。

### 语法

```
COPY INTO [<db_name>.]<table_name> FROM {copy_from_param} PROPERTIES (
    {copy_into_properties}
)
```

其中:

- `copy_from_param`

  指定了导入的stage名，文件，列的转换、映射、过滤规则等.

  ```
  copy_from_param ::=
      {stage_and_glob}
    | ( SELECT {copy_select_expr_list} FROM {stage_and_glob} {copy_where_expr_list} )
  ```

  ```
  stage_and_glob ::=
      @{stage_name}
    | @{stage_name}('{file_glob}')
  ```

  `stage_name`

  - 用户创建的external stage名

  - 属于用户的默认internal stage，名为`~`

  `file_glob`

  - 使用glob语法指定需要导入的文件

  `copy_select_expr_list`

  - 进行列的转换，映射等。可以通过调整输入数据源的列顺序来实现与目标表的不同列的进行映射（注意：只能进行整行映射）：

    ```
    copy_select_expr_list ::=
        *
      | { $<file_col_num> | <expr> }[ , ... ]
    ```

      `file_col_num`

      - 列在导入文件中按照指定分隔符分隔后的序号(如`1`表示第1列)

      `expr`

      - 指定一个表达式，比如算数运算等


  `copy_where_expr_list`

  - 对文件中的列按照表达式进行过滤，被过滤的行不会被导入到表中

    ```
    copy_where_expr_list ::=
        WHERE <predicate_expr>
    ```

- `copy_into_properties`

  指定CopyInto相关的参数。目前支持以下参数：

    - `file.type`

      导入文件的类型，目前支持`csv`,`json`,`orc`,`parquet`。

      非必需。如未设置，优先使用stage配置的默认文件类型；如果stage上未设置，系统自动推断类型。

    - `file.compression`

      导入文件的压缩类型，目前支持`gz`,`bz2`,`lz4`,`lzo`,`deflate`。

      非必需。如未设置，优先使用stage配置的默认压缩类型；如果stage上未设置，系统自动推断类型。

    - `file.column_separator`

      导入文件的列分隔符。

      非必需。如未设置，优先使用stage配置的默认列分隔符；如果stage上未设置，使用系统默认值`\t`。

    - `file.line_delimiter`

      导入文件的行分隔符。

      非必需。如未设置，优先使用stage配置的默认行分隔符；如果stage上未设置，使用系统默认值`\n`。

    - `copy.size_limit`

      导入的文件大小，单位为Byte。如果匹配的待导入文件超出大小限制，只导入满足大小限制的部分文件。

      非必需。如未设置，优先使用stage配置的默认导入大小；如果stage上未设置，默认不限制。

    - `copy.on_error`

      导入时，当数据质量不合格时的错误处理方式。目前支持:

      - `max_filter_ratio_{number}`：设置最大错误率为`{number}`，其中，`{number}`为`[0-1]`区间的浮点数。如果导入的数据的错误率低于阈值，则这些错误行将被忽略，其他正确的数据将被导入。
      - `abort_statement`：当数据有错误行时，中断导入，等价于`max_filter_ratio_0`。默认行为
      - `continue`：忽略错误行，导入正确行，等价于`max_filter_ratio_1`

      非必需。如未设置，优先使用stage配置的默认错误处理策略；如果stage上未设置，使用系统默认策略。

    - `copy.async`

      导入是否异步执行。支持`true`, `false`。 默认值为`true`，即异步执行，通过`show copy`查看异步执行的copy任务。

    - `copy.strict_mode`

      对于导入过程中的列类型转换进行严格过滤，参考Doris的导入严格模式。默认为`false`。

      非必需。如未设置，优先使用stage配置的默认模式；如果stage上未设置，使用系统默认策略。

### 输出

Copy into默认异步执行，返回一个`queryId`，如：

```
mysql> copy into db.t1 from @exs('2.csv');
+-----------------------------------+---------+------+------+------------+------------+--------------+------+
| id                                | state   | type | msg  | loadedRows | filterRows | unselectRows | url  |
+-----------------------------------+---------+------+------+------------+------------+--------------+------+
| 8fcf20b156dc4f66_99aa062042941aff | PENDING |      |      |            |            |              |      |
+-----------------------------------+---------+------+------+------------+------------+--------------+------+
1 row in set (0.14 sec)
```

根据`id`，使用`SHOW COPY`命令查询执行结果:

```
mysql> SHOW COPY WHERE id = '8fcf20b156dc4f66_99aa062042941aff';
+-----------------------------------+-------+----------------------------------------+----------+---------------------+------+-----------------------------------------------------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------+--------------+-------------------------------------------------------+
| Id                                | JobId | Label                                  | State    | Progress            | Type | EtlInfo                                             | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                                                                                                               | TransactionId    | ErrorTablets | Files                                                 |
+-----------------------------------+-------+----------------------------------------+----------+---------------------+------+-----------------------------------------------------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------+--------------+-------------------------------------------------------+
| 8fcf20b156dc4f66_99aa062042941aff | 17012 | copy_f8a124900f7d42f6_91dad473d45a34bd | FINISHED | ETL:100%; LOAD:100% | COPY | unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2 | cluster:N/A; timeout(s):14400; max_filter_ratio:0.0 | NULL     | 2022-10-21 09:06:48 | 2022-10-21 09:06:54 | 2022-10-21 09:06:54 | 2022-10-21 09:06:54 | 2022-10-21 09:06:55 | NULL | {"Unfinished backends":{"3e2fc170198240c0-929be46e8ca47838":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":30,"All backends":{"3e2fc170198240c0-929be46e8ca47838":[10003]},"FileNumber":1,"FileSize":14} | 6141324627542016 | {}           | ["s3://justtmp-bj-1308700295/meiyi_cloud_test/2.csv"] |
+-----------------------------------+-------+----------------------------------------+----------+---------------------+------+-----------------------------------------------------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------+--------------+-------------------------------------------------------+
1 row in set (0.01 sec)
```

其中，`files`列为本次Copy任务导入的文件。

### 举例

* 把名为`ext_stage`的stage中的数据，导入到表`test_table`中

  ```
  COPY INTO test_table FROM @ext_stage
  ```

  系统会自动扫描stage下未导入到表`test_table`中的部分文件，进行导入

* 把名为`ext_stage`的stage中的数据文件`1.csv`，导入到表`test_table`中

  ```
  COPY INTO test_table FROM @ext_stage('1.csv')
  ```

* 把名为`ext_stage`的stage中的数据文件`dir1/subdir_2/1.csv`，导入到表`test_table`中

  如果创建`ext_stage`时，prefix为空，则导入语句为：

  ```
  COPY INTO test_table FROM @ext_stage('dir1/subdir_2/1.csv')
  ```

  如果创建`ext_stage`时，prefix为`dir1`，则导入语句为：

  ```
  COPY INTO test_table FROM @ext_stage('subdir_2/1.csv')
  ```

  如果创建`ext_stage`时，prefix为`dir1/subdir_2`，则导入语句为：

  ```
  COPY INTO test_table FROM @ext_stage('1.csv')
  ```

* 把名为`ext_stage`的stage中的`dir1/subdir_2/`路径下`.csv`结尾的文件，导入到表`test_table`中

  如果创建`ext_stage`时，prefix为空，则导入语句为：

  ```
  COPY INTO test_table FROM @ext_stage('dir1/subdir_2/*.csv')
  ```

  如果创建`ext_stage`时，prefix为`dir1`，则导入语句为：

  ```
  COPY INTO test_table FROM @ext_stage('subdir_2/*.csv')
  ```

  如果创建`ext_stage`时，prefix为`dir1/subdir_2`，则导入语句为：

  ```
  COPY INTO test_table FROM @ext_stage('*.csv')
  ```

* 把名为`ext_stage`的stage中的`dir1`目录下的各级子目录中以`.csv`结尾的文件，导入到表`test_table`中

  ```
  COPY INTO test_table FROM @ext_stage('dir1/**.csv')
  ```

* 把名为`ext_stage`的stage中的数据文件`1.csv`，导入到表`test_table`中，并指定文件的列分隔符为`,`，行分隔符为`\n`:

  ```
  COPY INTO test_table FROM @ext_stage('1.csv') PROPERTIES (
      'file.column_separator' = ',',
      'file.line_delimiter' = '\n'
  )
  ```

* 把名为`ext_stage`的stage中的数据文件`1.csv`，导入到表`test_table`中，并指定同步执行:

  ```
  COPY INTO test_table FROM @ext_stage('1.csv') PROPERTIES (
      'copy.async' = 'false'
  )
  ```

* 把用户默认的internal stage中的数据文件`1.csv`，导入到表`test_table`中

  ```
  COPY INTO test_table FROM @~('1.csv')
  ```

* 列的映射，转换，过滤等

  假如文件有3列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列)，分别导入到表的三列：`id`,`name`,`score`， 即`$1`$\rightarrow$`id`, `$2`$\rightarrow$`name`, `$3`$\rightarrow$`score`, 以下几个语句等价：

  ```
  COPY INTO test_table FROM (SELECT * FROM @ext_stage('1.csv'))
  COPY INTO test_table FROM (SELECT $1, $2, $3 FROM @ext_stage('1.csv'))
  ```

  假如文件有4列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列),`$4`(第4列)，分别将1,3,4列导入到表的三列：`id`,`name`,`score`，即`$1`$\rightarrow$`id`, `$3`$\rightarrow$`name`, `$4`$\rightarrow$`score`：

  ```
  COPY INTO test_table FROM (SELECT $1, $3, $4 FROM @ext_stage('1.csv'))
  ```

  假如文件有2列，分别为`$1`(第1列),`$2`(第2列)，分别导入到表的前两列：`id`,`name`，`score`使用表的默认值或`NULL`，即`$1`$\rightarrow$`id`, `$2`$\rightarrow$`name`, `NULL`$\rightarrow$`score`

  ```
  COPY INTO test_table FROM (SELECT $1, $2, NULL FROM @ext_stage('1.csv'))
  ```

  假如文件有3列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列)，分别将1,3,2列导入到表的三列：`id`,`name`,`score`，即`$1`$\rightarrow$`id`, `$3`$\rightarrow$`name`, `$2`$\rightarrow$`score`：

  ```
  COPY INTO test_table FROM (SELECT $1, $3, $2 FROM @ext_stage('1.csv'))
  ```

  假如文件有3列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列)，过滤出第三列大于`60`的，然后分别导入到表的三列：`id`, `name`, `score`：

  ```
  COPY INTO test_table FROM (SELECT $1, $2, $3 FROM @ext_stage('1.csv') WHERE $3 > 60)
  ```

  假如文件有3列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列)，对第三列统一增加`10`的，然后分别导入到表的三列：`id`,`name`,`score`：

  ```
  COPY INTO test_table FROM (SELECT $1, $2, $3 + 10 FROM @ext_stage('1.csv'))
  ```

  假如文件有3列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列)，过滤出第三列小于`60`的，然后分别加`10`，再导入到表的三列：`id`,`name`,`score`：

  ```
  COPY INTO test_table FROM (SELECT $1, $2, $3 + 10 FROM @ext_stage('1.csv') WHERE $3 < 60)
  ```

  假如文件有3列，分别为`$1`(第1列),`$2`(第2列),`$3`(第3列)，对第二列的字符串进行截取，再导入到表的三列：`id`,`name`,`score`：

  ```
  COPY INTO test_table FROM (SELECT $1, substring($2, 2), $3 FROM @ext_stage('1.csv'))
  ```



## 通过内置Stage进行推送导入

如果用户没有外部的对象存储，可以把数据文件暂存在SelectDB提供的默认对象存储中，称之为internal stage。

不同于external stage：

1. internal stage无需手动创建，在用户第一次使用时会自动创建。名字是固定的，为`~`；

2. 只能当前owner访问，不支持grant权限给其他user；

3. 无法进行list，用户需要自己记住上传了哪些文件；

然后调用导入语句copy into，把文件导入到表中。

### 语法

上传文件:

```
curl -u {user}:{password} -H "fileName: {file_name_in_storage}" -T {local_file_path} -L '{selectdb_host}:{selectdb_copy_port}/copy/upload'
```

将文件导入到SelectDB的表中（注意：请求body的内容为`json`格式，需要对sql中的部分字符进行转义）：

```
curl -X POST -u {user}:{password} '{selectdb_host}:{selectdb_copy_port}/copy/query'  -H "Content-Type: application/json" -d '{"sql": "{copy_into_sql}"}'
```

### 举例

1. 用户user1把本地文件`data/2022-10-20/1.csv`上传到internal stage中，上传后的文件命名为`2020/1.csv`:

```
curl -u user1:passwd -H "fileName: 2022-10-20/1.csv" -T data/2022-10-20/1.csv -L '172.21.21.12:8035/copy/upload'
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0    14    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100    14    0     0  100    14      0     28 --:--:-- --:--:-- --:--:--    28
```

执行导入：

```
curl -X POST -u user1:password '172.21.21.12:8035/copy/query'  -H "Content-Type: application/json" -d '{"sql": "copy into db1.t5 from @~(\"2022-10-20/1.csv\")"}'
```



## 通过SDK进行内置Stage导入

如上所述，通过内置Stage进行数据导入的时候，会调用两次API。为了方便操作，我们将两次api调用封装在SDK中，在程序中引入sdk后，通过一次调用即可完成内置Stage数据导入。

### 下载

SDK地址： [selectdb-java-sdk-1.0.0](https://jiafeng-beijing-1308700295.cos.ap-beijing.myqcloud.com/sdk/selectdb-java-sdk-1.0.0-SNAPSHOT.jar)

### 使用方法

通过maven install的方式将SDK安装到本地仓库

```java
mvn org.apache.maven.plugins:maven-install-plugin:3.0.0-M1:install-file -Dfile=selectdb-java-sdk-1.0.0-SNAPSHOT.jar
```

POM文件中添加依赖

```java
 <dependency>
     <groupId>com.selectdb</groupId>
     <artifactId>selectdb-java-sdk</artifactId>
     <version>1.0.0-SNAPSHOT</version>
</dependency>
```

#### 简单String导入

```java
SelectdbClient client = SelectdbClient.builder()
                .setHost("127.0.0.1")
                .setHttpPort(59806)
                .setJdbcPort(28463)
                .setDatabase("db")
                .setTable("tbl")
                .setClusterName("cluster1")
                .setUsername("admin")
                .setPassword("passwd")
                 //对应copy into的参数
                .addProperty(LoadConstants.FORMAT, "json")
                .addProperty(LoadConstants.STRIP_OUTER_ARRAY, "false")
                .addProperty(LoadConstants.COPY_ASYNC, "false")
                .build();

        String value = "{\"name\":\"zhangsan\",\"age\":1}\n{\"name\":\"lisi\",\"age\":2}";
        BaseResponse<StageLoadResult> response = client.stageLoad(value);
```

#### 批量List导入

```java
SelectdbClient client = SelectdbClient.builder()
                .setHost("127.0.0.1")
                .setHttpPort(44464)
                .setJdbcPort(14406)
                .setDatabase("db")
                .setTable("tbl")
                .setClusterName("cluster1")
                .setUsername("admin")
                .setPassword("123456")
                 //对应copy into的参数
                .addProperty(LoadConstants.FORMAT, "json")
                .addProperty(LoadConstants.STRIP_OUTER_ARRAY, "false")
                .addProperty(LoadConstants.COPY_ASYNC, "false")
                .build();

        List<User> data = new ArrayList<>();
        User user1 = new User();
        user1.name = "zhangsan";
        user1.age = 1;

        User user2 = new User();
        user2.name = "lisi";
        user2.age = 2;
        data.add(user1);
        data.add(user2);

        BaseResponse<StageLoadResult> response = client.stageLoad(data);
```
