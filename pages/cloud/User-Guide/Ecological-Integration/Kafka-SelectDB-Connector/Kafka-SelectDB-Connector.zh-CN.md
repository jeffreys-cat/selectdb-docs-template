# Kafka SelectDB Connector

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) 是一款可扩展、可靠的在 Apache Kafka 和其他系统之间进行数据传输的工具，可以定义 Connectors 将大量数据迁入迁出Kafka。

Selectdb提供了Sink Connector插件，可以将Kafka topic中的JSON数据写入到Selectdb中。

## 版本支持

| Kafka | Java | Runtime Jar                                                  |
| ----- | ---- | ------------------------------------------------------------ |
| 2.4.x | 8    | [kafka-connect-selectdb-1.0.0](https://selectdb.s3.amazonaws.com/connector/kafka-connect-selectdb-1.0.0.jar) |

## Kafka Connect使用
将下载的jar包复制到Kafka的libs目录中，启动Kafka Connector即可。

### Standalone模式启动

#### 配置connect-standalone.properties

```properties
#修改broker地址
bootstrap.servers=127.0.0.1:9092
```

#### 配置connect-selectdb-sink.properties

```properties
name=test-selectdb-sink
connector.class=com.selectdb.kafka.connector.SelectdbSinkConnector
topics=topic
selectdb.topic2table.map=topic:test_kafka_tbl
buffer.count.records=10000
buffer.flush.time=120
buffer.size.bytes=5000000
selectdb.url=xxx.cn-beijing.privatelink.aliyuncs.com
selectdb.http.port=1234
selectdb.query.port=1234
selectdb.user=admin
selectdb.password=***
selectdb.database=test_db
selectdb.cluster=cluster_name
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
key.converter.schemas.enable=false
value.converter.schemas.enable=false
```

#### 启动Standalone

```shell
$KAFKA_HOME/bin/connect-standalone.sh $KAFKA_HOME/config/connect-standalone.properties -daemon $KAFKA_HOME/config/connect-selectdb-sink.properties
```
注意：一般不建议在生产环境中使用standalone模式

### Distributed模式启动

#### 配置connect-distributed.properties

```properties
#修改broker地址
bootstrap.servers=127.0.0.1:9092

#修改group.id，同一集群的需要一致
group.id=connect-cluster
```

#### 启动Distributed

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

#### 增加Connector

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-selectdb-sink-cluster",
  "config":{
    "connector.class":"com.selectdb.kafka.connector.SelectdbSinkConnector",
    "tasks.max":"8",
    "topics":"topic",
    "selectdb.topic2table.map": "topic:test_kafka_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "selectdb.url":"xx.cn-beijing.privatelink.aliyuncs.com",
    "selectdb.user":"admin",
    "selectdb.password":"***",
    "selectdb.http.port":"1234",
    "selectdb.query.port":"1234",
    "selectdb.database":"test_db",
    "selectdb.cluster":"cluster_name",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable":"false",
    "value.converter.schemas.enable":"false"
  }
}'
```

#### 操作Connector
```shell
# 查看connector状态
curl -i http://127.0.0.1:8083/connectors/test-selectdb-sink-cluster/status -X GET
# 删除当前connector
curl -i http://127.0.0.1:8083/connectors/test-selectdb-sink-cluster -X DELETE
# 暂停当前connector
curl -i http://127.0.0.1:8083/connectors/test-selectdb-sink-cluster/pause -X PUT
# 重启当前connector
curl -i http://127.0.0.1:8083/connectors/test-selectdb-sink-cluster/resume -X PUT
# 重启connector内的tasks
curl -i http://127.0.0.1:8083/connectors/test-selectdb-sink-cluster/tasks/0/restart -X POST
```
参考：[Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)


### 访问 SSL 认证的 Kafka 集群

通过 kafka-connect 访问 SSL 认证的 Kafka 集群需要用户提供用于认证 Kafka Broker 公钥的证书文件（client.truststore.jks）。你可以在 `connect-distributed.properties` 文件中增加以下配置：

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

关于通过 kafka-connect 连接 SSL 认证的 Kafka 集群配置说明可以参考：[Configure Kafka Connect](https://docs.confluent.io/5.1.2/tutorials/security_tutorial.html#configure-kconnect-long)

## 配置项

| Key                      | Default Value | **Required** | **Description**                                                                   |
| ------------------------ |---------------|--------------|-----------------------------------------------------------------------------------|
| name                     | -             | Y            | Connect应用名称，必须是在Kafka Connect环境中唯一                                                |
| connector.class          | -             | Y            | com.selectdb.kafka.connector.SelectdbSinkConnector                                |
| tasks.max                | -             | Y            | 任务数，通常与 Kafka Connect 集群中工作节点的 CPU 内核数相同                                          |
| topics                   | -             | Y            | 订阅的topic列表，逗号分隔: topic1,topic2                                                    |
| selectdb.url             | -             | Y            | Selectdb 连接地址                                                                     |
| selectdb.http.port       | -             | Y            | Selectdb HTTP协议端口                                                                 |
| selectdb.query.port      | -             | Y            | Selectdb MySQL协议端口                                                                |
| selectdb.user            | -             | Y            | Selectdb 用户名                                                                      |
| selectdb.password        | -             | Y            | Selectdb 密码                                                                       |
| selectdb.database        | -             | Y            | 要写入的数据库                                                                           |
| selectdb.cluster         | -             | Y            | 写入要用到的集群名称                                                                        |
| selectdb.topic2table.map | -             | N            | topic和table表的对应关系，例：topic1:tb1,topic2:tb2 默认为空，表示topic和table名称一一对应                |
| buffer.count.records     | 10000         | N            | 在flush到selectdb之前，每个 Kafka 分区在内存中缓冲的记录数。默认 10000 条记录                              |
| buffer.flush.time        | 120           | N            | buffer刷新间隔，单位秒，默认120秒                                                             |
| buffer.size.bytes        | 5000000(5MB)  | N            | 每个 Kafka 分区在内存中缓冲的记录的累积大小，单位字节，默认5MB                                              |
| jmx                      | true          | N            | 默认开启 JMX ，获取 connector 内部监控指标，参考: [Selectdb-Connector-JMX](./02-Connector-JMX.md) |

其他Kafka Connect Sink通用配置项可参考：[Kafka Connect Sink Configuration Properties](https://docs.confluent.io/platform/current/installation/configuration/connect/sink-connect-configs.html#kconnect-long-sink-configuration-properties-for-cp)