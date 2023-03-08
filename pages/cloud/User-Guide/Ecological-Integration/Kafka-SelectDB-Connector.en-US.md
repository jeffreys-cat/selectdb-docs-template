# Kafka SelectDB Connector

 [Kafka Connect](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://docs.confluent.io/platform/current/connect/index.html) is a scalable and reliable tool for data transmission between Apache Kafka and other systems. Connectors can be defined to move large amounts of data in and out of Kafka.

Selectdb provides the Sink Connector plug-in, which can write JSON data in Kafka topic to Selectdb.

## Version support

| Kafka | Java | Runtime Jar                                                  |
| ----- | ---- | ------------------------------------------------------------ |
| 2.4.x | 8    | [kafka-connect-selectdb-1.0.0](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://selectdb.s3.amazonaws.com/connector/kafka-connect-selectdb-1.0.0.jar) |

## Kafka Connect Usage

### Standalone mode

#### Configure connect-standalone.properties

```properties
# broker address
bootstrap.servers=127.0.0.1:9092
```

#### Configure connect-selectdb-sink.properties

```properties
name=test-selectdb-sink
connector.class=com.selectdb.kafka.connector.SelectdbSinkConnector
topics=topic
selectdb.topic2table.map=topic:test_kafka_tbl
buffer.count.records=10000
buffer.flush.time=60
buffer.size.bytes=5000000
selectdb.url=xxx.cn-beijing.privatelink.aliyuncs.com
selectdb.http.port=48614
selectdb.query.port=25865
selectdb.user=admin
selectdb.password=
selectdb.database=test_db
selectdb.cluster=cluster_name
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
key.converter.schemas.enable=false
value.converter.schemas.enable=false
```

#### Start 

```shell
$KAFKA_HOME/bin/connect-standalone.sh $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/connect-selectdb-sink.properties
```

### Distributed mode

#### Configure connect-distributed.properties

```properties
# broker address
bootstrap.servers=127.0.0.1:9092

# Modify group.id, the same cluster needs to be consistent
group.id=connect-cluster
```

#### Start

```shell
$KAFKA_HOME/bin/connect-distributed.sh $KAFKA_HOME/config/connect-distributed.properties
```

#### Add connector

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-selectdb-sink-cluster",
  "config":{
    "connector.class":"com.selectdb.kafka.connector.SelectdbSinkConnector",
    "topics":"topic",
    "selectdb.topic2table.map": "topic:test_kafka_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"60",
    "buffer.size.bytes":"5000000",
    "selectdb.url":"xx.cn-beijing.privatelink.aliyuncs.com",
    "selectdb.user":"admin",
    "selectdb.password":"",
    "selectdb.http.port":"48614",
    "selectdb.query.port":"25865",
    "selectdb.database":"test_db",
    "selectdb.cluster":"cluster_name",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable":"false",
    "value.converter.schemas.enable":"false",
  }
}'
```



### Access an SSL-certified Kafka cluster

Accessing the SSL-certified Kafka cluster through kafka-connect requires the user to provide the certificate file (client.truststore.jks) used to authenticate the Kafka Broker public key. You can add the following configuration to the `connect-distributed.properties`file :

```properties
# Connect worker
security.protocol=SSL
ssl.truststore.location=/var/ssl/private/client.truststore.jks
ssl.truststore.password=test1234

# Embedded consumer for sink connectors
consumer.security.protocol=SSL
consumer.ssl.truststore.location=/var/ssl/private/client.truststore.jks
consumer.ssl.truststore.password=test1234
```



For instructions on configuring Kafka clusters with SSL authentication through kafka-connect, please refer to: [Configure Kafka Connect](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://docs.confluent.io/5.1.2/tutorials/security_tutorial.html%23configure-kconnect-long)

## Configuration items

| Key                      | Default Value | **Required** | **Description**                                              |
| ------------------------ | ------------- | ------------ | ------------------------------------------------------------ |
| name                     | -             | Y            | Connect application name, must be unique in the Kafka Connect environment |
| connector.class          | -             | Y            | com.selectdb.kafka.connector.SelectdbSinkConnector           |
| topics                   | -             | Y            | A list of topics to subscribe to, separated by commas: topic1,topic2 |
| selectdb.url             | -             | Y            | Selectdb connection address                                  |
| selectdb.http.port       | -             | Y            | Selectdb HTTP protocol port                                  |
| selectdb.query.port      | -             | Y            | Selectdb MySQL protocol port                                 |
| selectdb.user            | -             | Y            | Selectdb username                                            |
| selectdb.password        | -             | Y            | Selectdb password                                            |
| selectdb.database        | -             | Y            | the database to write to                                     |
| selectdb.cluster         | -             | Y            | Write the cluster name to use                                |
| selectdb.topic2table.map | -             | N            | Mapping between topic and table tables, for example: topic1:tb1, topic2:tb2 is empty by default, indicating that topic and table names correspond one-to-one |
| buffer.count.records     | 10000         | N            | The number of records buffered in memory per Kafka partition before flushing to selectdb. Default 10000 records |
| buffer.flush.time        | 120           | N            | Buffer refresh interval, in seconds, default 120 seconds     |
| buffer.size.bytes        | 5000000(5MB)  | N            | Cumulative size of records buffered in memory for each Kafka partition, in bytes, default 5MB |
| jmx                      | true          | N            | JMX is enabled by default to obtain connector internal monitoring indicators |

For other general configuration items of Kafka Connect Sink, please refer to: [Kafka Connect Sink Configuration Properties](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://docs.confluent.io/platform/current/installation/configuration/connect/sink-connect-configs.html%23kconnect-long-sink-configuration-properties-for-cp)
