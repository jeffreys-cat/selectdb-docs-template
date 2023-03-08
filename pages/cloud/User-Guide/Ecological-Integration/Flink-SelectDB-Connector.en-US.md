# Flink SelectDB Connector

Flink SelectDB Connector supports writing upstream data into SelectDB through Flink DataStream API and FlinkSQL.

## Connector v2.0.0

### Version support

| Considerable | Java | Runtime Jar                                                  |
| ------------ | ---- | ------------------------------------------------------------ |
| 1.13         | 8    | scala2.11 [flink-selectdb-connector-1.13_2.11-2.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.11-2.0.0-SNAPSHOT.jar) scala2.12 [flink-selectdb-connector-1.13_2.12-2.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.12-2.0.0-SNAPSHOT.jar) |
| 1.14         | 8    | scala2.11 [flink-selectdb-connector-1.14_2.11-2.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.11-2.0.0-SNAPSHOT.jar) scala2.12 [flink-selectdb-connector-1.14_2.12-2.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.12-2.0.0-SNAPSHOT.jar) |
| 1.15         | 8    | [hefty-selectdb-connector-1.15-2.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.15-2.0.0-SNAPSHOT.jar) |
| 1.16         | 8    | [hefty-selectdb-connector-1.16-2.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.16-2.0.0-SNAPSHOT.jar) |

### How to use

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
  
  --  csv format
  -- 'sink.properties.file.column_separator' = '\x01',
  -- 'sink.properties.file.line_delimiter' = '\x02',
  
  -- json format
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
// csv format
properties.setProperty("file.column_separator", ",");
properties.setProperty("file.line_delimiter", "\n");
properties.setProperty("file.type", "csv");
// json format
// properties.setProperty("file.strip_outer_array", "false");
// properties.setProperty("file.type", "json");

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



### Configuration item

1. | Key               | Default Value   | **Required** | **Description**                                              |
   | ----------------- | --------------- | ------------ | ------------------------------------------------------------ |
   | load-url          | -               | AND          | Selectdb import url, for example: connection address: httpPort |
   | jdbc-url          | -               | AND          | Selectdb query url, for example: connection address: jdbcPort |
   | cluster-name      | -               | AND          | selectdb cluster name                                        |
   | table.identifier  | -               | AND          | The table to be written, for example: db.table               |
   | username          | -               | AND          | username                                                     |
   | password          | -               | AND          | password                                                     |
   | sink.properties   | -               | AND          | CSV format: <br />sink.properties.file.type='csv' <br />sink.properties.file.column_separator=',' <br />sink.properties.file.line_delimiter='\n' <br />JSON format: <br />sink.properties. file.type='json' <br />sink.properties.file.strip_outer_array='false' |
   | sink.buffer-size  | 5,242,880 (5MB) | N            | The maximum capacity of the cache, in bytes, will be flushed to the object storage if it is exceeded, and the default is 5MB. |
   | sink.buffer-count | 10000           | N            | The maximum number of entries in the cache will be flushed to the object storage if it is exceeded. The default is 10000. |
   | sink.max-retries  | 3               | N            | The maximum number of retries in the Commit phase (Copy Into execution), the default is 3 times |

   

## Connector v1.0.0

### Version support

| Considerable | Java | Runtime Jar                                                  |
| ------------ | ---- | ------------------------------------------------------------ |
| 1.13.x       | 8    | scala2.11 [flink-selectdb-connector-1.13_2.11-1.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.11-1.0.0-SNAPSHOT.jar) scala2.12 [flink-selectdb-connector-1.13_2.12-1.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.13_2.12-1.0.0-SNAPSHOT.jar) |
| 1.14.x       | 8    | scala2.11 [flink-selectdb-connector-1.14_2.11-1.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.11-1.0.0-SNAPSHOT.jar) scala2.12 [flink-selectdb-connector-1.14_2.12-1.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.14_2.12-1.0.0-SNAPSHOT.jar) |
| 1.15.x       | 8    | [hefty-selectdb-connector-1.15-1.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/flink-selectdb-connector-1.15-1.0.0-SNAPSHOT.jar) |

### How to use

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
env.fromElements("{\"name\": \"jack\", \"age\": \"1\"}")
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
  -- csv
  -- 'sink.properties.file.column_separator' = '\x01',
  -- 'sink.properties.file.line_delimiter' = '\x02',
  
  -- json
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
//csv
properties.setProperty("file.column_separator", ",");
properties.setProperty("file.line_delimiter", "\n");
properties.setProperty("file.type", "csv");
//json
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



### Configuration item

| Key              | Default Value | **Required** | **Description**                                              |
| ---------------- | ------------- | ------------ | ------------------------------------------------------------ |
| load-url         | -             | AND          | Selectdb import url, for example: connection address: httpPort |
| jdbc-url         | -             | AND          | Selectdb query url, for example: connection address: jdbcPort |
| cluster-name     | -             | AND          | selectdb cluster name                                        |
| table.identifier | -             | AND          | The table to be written, for example: db.table               |
| username         | -             | AND          | username                                                     |
| password         | -             | AND          | password                                                     |
| sink.properties  | -             | AND          | CSV format: <br />sink.properties.file.type='csv'<br />sink.properties.file.column_separator=',' <br />sink.properties.file.line_delimiter='\n' <br />JSON format: <br />sink.properties. file.type='json' <br />sink.properties.file.strip_outer_array='false' (true in Flink1.13) |

#### Flink1.13 parameters

| Key                 | Default Value  | **Required** | **Description**                                              |
| ------------------- | -------------- | ------------ | ------------------------------------------------------------ |
| sink.batch.size     | 10000          | N            | The maximum number of rows for a single flush                |
| sink.max-retries    | 3              | N            | Number of retries after flush failure                        |
| sink.batch.interval | 10s            | N            | Flush interval, the default value is 10 seconds. Support time unit ms/s/min/h/d (default milliseconds). Set to 0 to turn off periodic writes. |
| sink.batch.bytes    | 10485760(10MB) | N            | The maximum number of bytes of flush, unit byte, default 10MB |

#### Flink1.14+ parameters

| Key                 | Default Value   | **Required** | **Description**                                              |
| ------------------- | --------------- | ------------ | ------------------------------------------------------------ |
| sink.buffer-size    | 1024*1024 (1MB) | N            | Write data cache buffer size, unit byte. The default is 1MB, and it is not recommended to modify it. |
| sink.buffer-count   | 3               | N            | The number of write data cache buffers, the default is 3, it is not recommended to modify. |
| sink.max-retries    | 1               | N            | The maximum number of retries in the Commit phase, the default is 1 |
| sink.check-interval | 10000           | N            | The interval for periodically writing files, in milliseconds, defaults to 10 seconds, and it is not recommended to modify. |

[
](https://cn-selectdb-com.translate.goog/cloud-docs/使用指南/外部表?_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp)