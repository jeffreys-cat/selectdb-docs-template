

# Flink SelectDB Connector

Flink SelectDB Connector 支持通过Flink DataStream API 和 FlinkSQL 将上游的数据写入到SelectDB中。

## Connector v2.0.0

### 版本支持

| Flink | Java | Runtime Jar                                                  |
| ----- | ---- | ------------------------------------------------------------ |
| 1.13  | 8    | scala2.11 [flink-selectdb-connector-1.13_2.11-2.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.11-2.0.0-SNAPSHOT.jar)  scala2.12 [flink-selectdb-connector-1.13_2.12-2.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.12-2.0.0-SNAPSHOT.jar) |
| 1.14  | 8    | scala2.11 [flink-selectdb-connector-1.14_2.11-2.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.11-2.0.0-SNAPSHOT.jar)  scala2.12 [flink-selectdb-connector-1.14_2.12-2.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.12-2.0.0-SNAPSHOT.jar) |
| 1.15  | 8    | [flink-selectdb-connector-1.15-2.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.15-2.0.0-SNAPSHOT.jar) |
| 1.16  | 8    | [flink-selectdb-connector-1.16-2.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.16-2.0.0-SNAPSHOT.jar) |

### 使用方法

#### FlinkSQL

```sql
CREATE TABLE selectdb_sink (
name STRING,
age INT
) 
WITH (
  'connector' = 'selectdb',
  'load-url' = 'xxx.privatelink.aliyun.com:47057',
  'jdbc-url' = 'xxx.privatelink.aliyun.com:30523',
  'cluster-name' = 'clustername',
  'table.identifier' = 'database.table',
  'username' = 'admin',
  'password' = '',
  -- csv 写入
  -- 'sink.properties.file.column_separator' = '\x01',
  -- 'sink.properties.file.line_delimiter' = '\x02',
  -- json 写入
  'sink.properties.file.type' = 'json',
  'sink.properties.file.strip_outer_array' = 'false'
);
```

#### DataStream

```java
// enable checkpoint
env.enableCheckpointing(10000);

SelectdbSink.Builder<String> builder = SelectdbSink.builder();
SelectdbOptions.Builder selectdbBuilder = SelectdbOptions.builder();
selectdbBuilder.setLoadUrl("ip:httpPort")
        .setJdbcUrl("ip:jdbcPort")
        .setClusterName("clustername")
        .setTableIdentifier("db.table")
        .setUsername("root")
        .setPassword("password");

Properties properties = new Properties();
//csv写入
properties.setProperty("file.column_separator", ",");
properties.setProperty("file.line_delimiter", "\n");
properties.setProperty("file.type", "csv");
//json写入
//properties.setProperty("file.strip_outer_array", "false");
//properties.setProperty("file.type", "json");

SelectdbExecutionOptions.Builder  executionBuilder = SelectdbExecutionOptions.builder();
executionBuilder.setLoadProps(properties); 

builder.setSelectdbExecutionOptions(executionBuilder.build())
        .setSerializer(new SimpleStringSerializer()) //serialize according to string 
        .setSelectdbOptions(selectdbBuilder.build());

//mock csv string source
List<Tuple2<String, Integer>> data = new ArrayList<>();
data.add(new Tuple2<>("selectdb",1));
DataStreamSource<Tuple2<String, Integer>> source = env.fromCollection(data);

source.map((MapFunction<Tuple2<String, Integer>, String>) t -> t.f0 + "," + t.f1)
      .sinkTo(builder.build());
```

### 配置项

| Key              | Default Value | **Required** | **Description**                                              |
| ---------------- | ------------- | ------------ | ------------------------------------------------------------ |
| load-url         | -             | Y            | Selectdb 导入 url，例：连接地址:httpPort                     |
| jdbc-url         | -             | Y            | Selectdb 查询 url，例：连接地址:jdbcPort                     |
| cluster-name     | -             | Y            | selectdb 集群名称                                            |
| table.identifier | -             | Y            | 写入的表，例：db.table                                       |
| username         | -             | Y            | 用户名                                                       |
| password         | -             | Y            | 密码                                                         |
| sink.properties  | -             | Y            | 写入属性配置 CSV写入：sink.properties.file.type='csv' sink.properties.file.column_separator=',' sink.properties.file.line_delimiter='\n' JSON写入: sink.properties.file.type='json' sink.properties.file.strip_outer_array='false' |
| sink.buffer-size    | 5242880 (5MB) | N            | 缓存的最大容量，单位字节，超过会flush到对象存储上，默认5MB。 |
| sink.buffer-count   | 10000         | N            | 缓存的最大条数，超过会flush到对象存储上，默认10000。    |
| sink.max-retries    | 3             | N            | Commit阶段(Copy Into执行)的最大重试次数，默认3次  |



## Connector v1.0.0

### 版本支持

| Flink  | Java | Runtime Jar                                                  |
| ------ | ---- | ------------------------------------------------------------ |
| 1.13.x | 8    | scala2.11 [flink-selectdb-connector-1.13_2.11-1.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.11-1.0.0-SNAPSHOT.jar)  scala2.12 [flink-selectdb-connector-1.13_2.12-1.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.12-1.0.0-SNAPSHOT.jar) |
| 1.14.x | 8    | scala2.11 [flink-selectdb-connector-1.14_2.11-1.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.11-1.0.0-SNAPSHOT.jar)  scala2.12 [flink-selectdb-connector-1.14_2.12-1.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.12-1.0.0-SNAPSHOT.jar) |
| 1.15.x | 8    | [flink-selectdb-connector-1.15-1.0.0](https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.15-1.0.0-SNAPSHOT.jar) |

### 使用方法

#### Flink 1.13

##### FlinkSQL

```sql
CREATE TABLE selectdb_sink (
name STRING,
age INT
) 
WITH (
  'connector' = 'selectdb',
  'load-url' = 'xxx.privatelink.aliyun.com:47057',
  'jdbc-url' = 'xxx.privatelink.aliyun.com:30523',
  'cluster-name' = 'clustername',
  'table.identifier' = 'database.table',
  'username' = 'admin',
  'password' = '',
  'sink.properties.file.type' = 'json',
  'sink.properties.file.strip_outer_array' = 'true'
);
```

##### DataStream

```java
Properties pro = new Properties();
pro.setProperty("file.type", "json");
pro.setProperty("file.strip_outer_array", "true");
env.fromElements("{\"name\": \"zhangsan\", \"age\": \"1\"}")
   .addSink(
           DorisSink.sink(
                   DorisExecutionOptions.builder()
                           .setStreamLoadProp(pro).build(),
                   DorisOptions.builder()
                           .setLoadUrl("xxx.privatelink.aliyun.com:47057")
                           .setJdbcUrl("xxx.privatelink.aliyun.com:30523")
                           .setClusterName("clustername")
                           .setTableIdentifier("database.tablename")
                           .setUsername("admin")
                           .setPassword("").build()
           ));
```

#### Flink1.14+

##### FlinkSQL

```sql
CREATE TABLE selectdb_sink (
name STRING,
age INT
) 
WITH (
  'connector' = 'selectdb',
  'load-url' = 'xxx.privatelink.aliyun.com:47057',
  'jdbc-url' = 'xxx.privatelink.aliyun.com:30523',
  'cluster-name' = 'clustername',
  'table.identifier' = 'database.table',
  'username' = 'admin',
  'password' = '',
  -- csv 写入
  -- 'sink.properties.file.column_separator' = '\x01',
  -- 'sink.properties.file.line_delimiter' = '\x02',
  -- json 写入
  'sink.properties.file.type' = 'json',
  'sink.properties.file.strip_outer_array' = 'false'
);
```

##### DataStream

```java
// enable checkpoint
env.enableCheckpointing(10000);

DorisSink.Builder<String> builder = DorisSink.builder();
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder.setLoadUrl("ip:httpPort")
        .setJdbcUrl("ip:jdbcPort")
        .setClusterName("clustername")
        .setTableIdentifier("db.table")
        .setUsername("root")
        .setPassword("password");

Properties properties = new Properties();
//csv写入
properties.setProperty("file.column_separator", ",");
properties.setProperty("file.line_delimiter", "\n");
properties.setProperty("file.type", "csv");
//json写入
//properties.setProperty("file.strip_outer_array", "false");
//properties.setProperty("file.type", "json");

DorisExecutionOptions.Builder  executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setStreamLoadProp(properties); 

builder.setDorisExecutionOptions(executionBuilder.build())
        .setSerializer(new SimpleStringSerializer()) //serialize according to string 
        .setDorisOptions(dorisBuilder.build());

//mock csv string source
List<Tuple2<String, Integer>> data = new ArrayList<>();
data.add(new Tuple2<>("doris",1));
DataStreamSource<Tuple2<String, Integer>> source = env.fromCollection(data);

source.map((MapFunction<Tuple2<String, Integer>, String>) t -> t.f0 + "," + t.f1)
      .sinkTo(builder.build());
```

### 配置项

| Key              | Default Value | **Required** | **Description**                                              |
| ---------------- | ------------- | ------------ | ------------------------------------------------------------ |
| load-url         | -             | Y            | Selectdb 导入 url，例：连接地址:httpPort                     |
| jdbc-url         | -             | Y            | Selectdb 查询 url，例：连接地址:jdbcPort                     |
| cluster-name     | -             | Y            | selectdb 集群名称                                            |
| table.identifier | -             | Y            | 写入的表，例：db.table                                       |
| username         | -             | Y            | 用户名                                                       |
| password         | -             | Y            | 密码                                                         |
| sink.properties  | -             | Y            | 写入属性配置 CSV写入：sink.properties.file.type='csv' sink.properties.file.column_separator=',' sink.properties.file.line_delimiter='\n' JSON写入: sink.properties.file.type='json' sink.properties.file.strip_outer_array='false' (Flink1.13中为true) |

#### Flink1.13参数

| Key                 | Default Value  | **Required** | **Description**                                              |
| ------------------- | -------------- | ------------ | ------------------------------------------------------------ |
| sink.batch.size     | 10000          | N            | 单次flush的最大行数                                          |
| sink.max-retries    | 3              | N            | flush失败后的重试次数                                        |
| sink.batch.interval | 10s            | N            | flush的间隔时间，默认值10秒。支持时间单位ms/s/min/h/d(默认毫秒)。设置为0表示关闭定期写入。 |
| sink.batch.bytes    | 10485760(10MB) | N            | flush的最大字节数，单位字节，默认10MB                        |

#### Flink1.14+参数

| Key                 | Default Value   | **Required** | **Description**                                       |
| ------------------- | --------------- | ------------ | ----------------------------------------------------- |
| sink.buffer-size    | 1024*1024 (1MB) | N            | 写数据缓存buffer大小，单位字节。默认1MB，不建议修改。 |
| sink.buffer-count   | 3               | N            | 写数据缓存buffer个数，默认3，不建议修改。             |
| sink.max-retries    | 1               | N            | Commit阶段的最大重试次数，默认1次                     |
| sink.check-interval | 10000           | N            | 定期写文件的间隔，单位毫秒，默认10秒，不建议修改。    |
