# Spark SelectDB Connector

## Quick introduction

Spark Selectdb Connector supports writing large amounts of upstream data to SelectDB Cloud.

## Implementation principle

The underlying implementation of Spark SelectDB Connector depends on the stage import method of SelectDB Cloud. By calling the SelectDB Cloud api (/copy/upload), a redirected object storage address is returned, and the byte stream is sent to the object storage address using http. Finally, through Copy into (/copyinto) to import the data in the object storage bucket to SelectDB Cloud. For the specific use of the stage import method, please refer to User Guide / Data Import / Stage Import.

## Version support

| Connector      | Runtime Jar                                                  |
| -------------- | ------------------------------------------------------------ |
| 2.3.4-2.11-1.0 | [spark-selectdb-connector-2.3.4_2.11-1.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/spark-selectdb-connector-2.3.4_2.11-1.0-SNAPSHOT.jar) |
| 3.1.2-2.12-1.0 | [spark-selectdb-connector-3.1.2_2.12-1.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/spark-selectdb-connector-3.1.2_2.12-1.0-SNAPSHOT.jar) |
| 3.2.0-2.12-1.0 | [spark-selectdb-connector-3.2.0_2.12-1.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/spark-selectdb-connector-3.2.0_2.12-1.0-SNAPSHOT.jar) |

> Notice:
>
> - The format of Connector is: spark-selectdb-connector-${spark.version}_${scala.version}-${connector.version}-SNAPSHOT.jar;
> - All jar packages are compiled with java 8;
> - [If you have other version requirements, you can contact us through the contact information](https://cn-selectdb-com.translate.goog/company?_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp#anchor) on the selectdb official website ;

## How to use

Copy the downloaded jar package to `Spark`the `ClassPath`to use it `spark-selectdb-connector`. For example, if the `Local`mode is running `Spark`, put this `jars/`file under the folder. `Yarn`If it runs in cluster mode `Spark`, put this file in the pre-deployment package. For example, `spark-selectdb-connector-2.3.4-2.11-1.0.-SNAPSHOT.jar`upload to hdfs and add the Jar package path on hdfs to the spark.yarn.jars parameter

- Upload `spark-selectdb-connector-2.3.4-2.11-1.0-SNAPSHOT.jar`to hdfs.

```shell
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-selectdb-connector-2.3.4-2.11-1.0-SNAPSHOT.jar /spark-jars/
```



- `spark-selectdb-connector-2.3.4-2.11-1.0-SNAPSHOT.jar`Add dependencies to the cluster .

```yaml
spark.yarn.jars=hdfs:///spark-jars/doris-spark-connector-3.1.2-2.12-1.0.0.jar
```



If you want to reference it in the project, you can use `mvn install`the method to install it to the local warehouse, and use the following method to add dependencies in maven.

```shell
<dependency>
  <groupId>com.selectdb.spark</groupId>
  <artifactId>spark-selectdb-connector-3.1_2.12</artifactId>
  <version>1.0</version>
</dependency>
```



## Example of use

Write through sparksql

```scala
val selectdbHttpPort = "127.0.0.1:47968"
val selectdbJdbc = "jdbc:mysql://127.0.0.1:18836/test"
val selectdbUser = "admin"
val selectdbPwd = "selectdb2022"
val selectdbTable = "test.test_order"
  
CREATE TEMPORARY VIEW test_order
USING selectdb
OPTIONS(
 "table.identifier"="test.test_order",
 "jdbc.url"="${selectdbJdbc}",
 "http.port"="${selectdbHttpPort}",
 "user"="${selectdbUser}",
 "password"="${selectdbPwd}",
 "sink.properties.file.type"="json"
);

insert into test_order select  order_id,order_amount,order_status from tmp_tb ;
```



Write via DataFrame

```scala
val spark = SparkSession.builder().master("local[1]").getOrCreate()
val df = spark.createDataFrame(Seq(
  ("1", 100, "Pending"),
  ("2", 200, null),
  ("3", 300, "received")
)).toDF("order_id", "order_amount", "order_status")

df.write
  .format("selectdb")
  .option("selectdb.http.port", selectdbHttpPort)
  .option("selectdb.table.identifier", selectdbTable)
  .option("user", selectdbUser)
  .option("password", selectdbPwd)
  .option("sink.batch.size", 4)
  .option("sink.max-retries", 2)
  .option("sink.properties.file.column_separator", "\t")
  .option("sink.properties.file.line_delimiter", "\n")
  .save()
```



## Configuration

| Key                       | DefaultValue | Comment                                                      | **Required** |
| ------------------------- | ------------ | ------------------------------------------------------------ | ------------ |
| selectdb.http.port        | --           | selectdb cloud http address                                  | AND          |
| selectdb.jdbc.url         | --           | selectdb cloud jdbc address, this configuration belongs to spark sql | AND          |
| selectdb.table.identifier | --           | selectdb cloud table name, format library name. table name, for example: db1.tbl1 | AND          |
| user                      | --           | Username to access selectdb cloud                            | AND          |
| password                  | --           | Password to access selectdb cloud                            | AND          |
| sink.batch.size           | 100000       | The maximum number of rows written to selectdb cloud at a time | N            |
| sink.max-retries          | 3            | Number of retries after write selectdb fails                 | N            |
| sink.properties.*         | --           | Import parameters for copy into. For example: "sink.properties.file.type"="json" For more parameter descriptions of copy into, please refer to the [copy into section](https://cn-selectdb-com.translate.goog/cloud-docs/使用指南/数据导入/Stage导入?_highlight=copy&_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp#copy-into) of the selectdb official website . |              |
