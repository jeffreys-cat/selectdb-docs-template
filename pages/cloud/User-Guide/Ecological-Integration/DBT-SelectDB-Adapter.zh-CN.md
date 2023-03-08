

# DBT SelectDB Adapter

[DBT(Data Build Tool)](https://docs.getdbt.com/docs/introduction) 是专注于做ELT（提取、加载、转换）中的T（Transform）—— “转换数据”环节的组件
dbt-selectdb adapter 是基于dbt-core 1.3.0 开发，依赖于mysql-connector-python驱动对selectdb进行数据转换。

## 版本支持

| selectdb/doris | python       | dbt-core  |
|----------------|--------------|-----------|
| ***/>=1.1.0    | >=3.8,<=3.10 | >=1.3.0   |

## dbt-selectdb adapter 使用

### dbt-selectdb adapter 安装
使用pip安装：
```shell
pip install dbt-selectdb
```
安装行为会默认安装所有dbt运行的依赖，可以使用如下命令查看验证：
```shell
dbt --version
```
如果系统未识别dbt这个命令，可以创建一条软连接：
```shell
ln -s /usr/local/python3/bin/dbt /usr/bin/dbt
```

### dbt-selectdb adapter 初始化
```shell
dbt init 
```
会出现询问式命令行，输入相应配置如下即可初始化一个dbt项目：

| 名称      | 默认值  | 含义                                            |  
|----------|------|-----------------------------------------------|
| project  |      | 项目名                                           |
| project  |      | 项目名                                           | 
| database |      | 输入对应编号选择适配器 （选择doris）             | 
| host     |      | selectdb fe的host                              | 
| port     | 9030 | selectdb fe的query_port                        |
| schema   |      | 在dbt-selectdb中，等同于database，库名                 |
| username |      | selectdb 的 username                           |
| password |      | selectdb 的 password，如果未设置，直接回车即可              |
| threads  | 1    | dbt-selectdb中并行度 （设置与集群能力不匹配的并行度会增加dbt运行失败风险） |


### dbt-selectdb adapter 运行
相关dbt运行文档，可参考[此处](https://docs.getdbt.com/docs/get-started/run-your-dbt-projects)。
进入到刚刚创建的项目目录下面，执行默认的dbt模型：
```shell
dbt run 
```
可以看到运行了两个model：my_first_dbt_model和my_second_dbt_model

他们分别是物化表table和视图view。

可以登陆selectdb，查看my_first_dbt_model和my_second_dbt_model的数据结果及建表语句。

### dbt-selectdb adapter 物化方式
dbt-selectdb 的 物化方式（Materialization）支持一下三种
1. view
2. table
3. incremental

#### View 

使用view作为物化模式，在Models每次运行时都会通过 create view as 语句重新构建为视图。(默认情况下，dbt 的物化方式为view)
``` 
优点：没有存储额外的数据，源数据之上的视图将始终包含最新的记录。
缺点：执行较大转换或嵌套在其他view之上的view查询速度很慢。
建议：通常从模型的视图开始，只有当您注意到性能问题时才更改为另一个物化方式。view最适合不进行重大转换的模型，例如重命名，列变更。
```

配置项：
```yaml
models:
  <resource-path>:
    +materialized: view
```
或者在model文件里面写
```jinja
{{ config(materialized = "view") }}
```

#### Table

使用表实现时，您的模型在每次运行时都会通过 create table as 语句重建为表。
``` 
优点：table查询速度会比view快。
缺点：table需要较长时间才能构建或重建，会额外存储数据，而且不能够做增量数据同步。
建议：建议对 BI 工具查询的model或下游查询、转换等操作较慢的model使用table物化方式。
```

配置项：
```yaml
models:
  <resource-path>:
    +materialized: table
    +duplicate_key: [ <column-name>, ... ],
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int,
    +properties: {<key>:<value>,...}
```
或者在model文件里面写
```jinja
{{ config(
    materialized = "table",
    duplicate_key = [ "<column-name>", ... ],
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "int",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```

上述配置项详情如下：

| 配置项                 | 描述                                    | Required?     |
|---------------------|---------------------------------------|---------------|
| `materialized`      | 该表的物化形式 （对应创建表模型为明细模型（Duplicate））     | Required      |
| `duplicate_key`     | 明细模型的排序列                              | Optional      |
| `partition_by`      | 表分区列                                  | Optional      |
| `partition_type`    | 表分区类型，range或list .(default: `RANGE`)  | Optional  |
| `partition_by_init` | 初始化的表分区                               | Optional      |
| `distributed_by`    | 表桶区列                                  | Optional      |
| `buckets`           | 分桶数量                                  | Optional      |
| `properties`        | 建表的其他配置                               | Optional      |




#### Incremental

以上次运行 dbt的 incremental model结果为基准，增量的将记录插入或更新到表中。
* 注意：selectdb的增量实现依赖于unique模型，如果有增量需求，在初始化该模型的数据时就指定物化为incremental
``` 
优点：只需转换新记录，可显著减少构建时间。
缺点：incremental模式需要额外的配置，是 dbt 的高级用法，需要复杂场景的支持和对应组件的适配。
建议：增量模型最适合基于事件相关的场景或 dbt 运行变得太慢时使用增量模型
```

配置项：
```yaml
models:
  <resource-path>:
    +materialized: incremental
    +unique_key: [ <column-name>, ... ],
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int,
    +properties: {<key>:<value>,...}
```
或者在model文件里面写
```jinja
{{ config(
    materialized = "incremental",
    unique_key = [ "<column-name>", ... ],
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "int",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```

上述配置项详情如下：

| 配置项                 | 描述                                   | Required?     |
|---------------------|--------------------------------------|---------------|
| `materialized`      | 该表的物化形式 （对应创建表模型为明细模型（unique））       | Required      |
| `unique_key`        | unique表的key列                         | Required       |
| `partition_by`      | 表分区列                                 | Optional      |
| `partition_type`    | 表分区类型，range或list .(default: `RANGE`) | Optional  |
| `partition_by_init` | 初始化的表分区                              | Optional      |
| `distributed_by`    | 表桶区列                                 | Optional      |
| `buckets`           | 分桶数量                                 | Optional      |
| `properties`        | 建表的其他配置                              | Optional      |
