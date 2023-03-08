# 使用 Java Management Extensions (JMX) 监视 Selectdb Kafka Connect
本主题介绍如何使用 Java 管理扩展 (JMX) 监控 Selectdb Kafka Connect。 

Kafka Connect 提供了部分默认的 JMX Metrics，Selectdb 也对这部分 Metrics 进行扩展，以便能获取到更多的监控指。
您也可以将这些指标导入到第三方的监控工具，包括（Prometheus、Grafana）。


## 配置 JMX
JMX Metrics 的功能默认是开启的，如果需要禁用这个功能，可以在参数中设置 `jmx=false`。
1. 启用 JMX 以连接到您的 Kafka 安装
   
   - 与远程服务器建立连接。请在 Kafka Connect 启动脚本 `KAFKA_JMX_OPTS` 参数中追加以下内容：
     ````
     export KAFKA_JMX_OPTS="-Dcom.sun.management.jmxremote=true
      -Dcom.sun.management.jmxremote.authenticate=false
      -Dcom.sun.management.jmxremote.ssl=false
      -Djava.rmi.server.hostname=<ip_address>
      -Dcom.sun.management.jmxremote.port=<jmx_port>"
     ````
     `<ip_address>` 为当前 Kafka Connect 主机地址

     `<jmx_port>` 指定监听 JMX 的端口（请确保该端口未被占用）

   - 在同一台服务器上建立连接。请在 Kafka Connect 启动脚本中添加 `JMX_PORT` 参数
     ````
     export JMX_PORT=<port_number>
     ````
2. 重启 Kafka Connect

## 使用 Selectdb Kafka Connect 管理 Beans(MBeans)
Selectdb Kafka Connector 提供了用于访问管理对象的 MBeans，通过这些 MBeans 指标，以便清晰的了解到连接器内部的状态。

Kafka Connector MBean 对象名称的一般格式为：
>`selectdb.kafka.connector:connector={connector_name}, task={task_id},category={category_name},name={metric_name}`

`connector={connector_name}` 在 Kafka Connect 配置文件中指定的名称 <br/>
`{task_id}` Kafka Connect 启动时默认分配的 task_id <br/>
`{category_name}` 指定 MBean 的名称，每个 MBean 包含具体的各项指标 <br/>
`{metric_name}` 指标名称 <br/>



以下为 Selectdb Kafka Connect 的 Category  与 Metrics 说明：<br/>

<table>
    <tr>
        <th>Category</th><th>Metric Name</th><th>Data Type</th><th>Description</th>
    </tr>
    <tr>
        <td rowspan="3">offsets</td><td>committed-offset</td><td>long</td><td>已成功提交至 Selectdb 的 offset </td>
    </tr>
    <tr>
        <td>flushed-offset</td><td>long</td><td>当前处于 flush 阶段的 offset</td>
    </tr>
    <tr>
        <td>processed-offset</td><td>long</td><td>当前正在处理的 offset </td>
    </tr>
    <tr>
        <td rowspan="3">total-processed</td><td>total-file-count</td><td>long</td><td>累计处理的文件总数</td>
    </tr>
    <tr>
        <td>total-record-count</td><td>long</td><td>累计处理的 record 总数</td>
    </tr>
    <tr>
        <td>total-data-size</td><td>long</td><td>累计处理的数据大小（单位：byte）</td>
    </tr>
    <tr>
        <td rowspan="3">buffer</td><td>buffer-record-count</td><td>long</td><td>往 selectdb 进行 flush 时候当前 buffer 中的 Record 数量</td>
    </tr>
    <tr>
        <td>buffer-size-bytes</td><td>long</td><td>往 selectdb 进行 flush 时候当前 buffer 中的 bytes 大小</td>
    </tr>
    <tr>
        <td>buffer-memory-usage</td><td>long</td><td>当前 buffer 所占用的内存大小（单位：byte）</td>
    </tr>
    <tr>
        <td rowspan="2">latencies</td><td>commit-lag</td><td>long</td><td>从调用 uploadFile API 将文件上传后，到即将提交已处理完的 offset 到 kafka 中间阶段的平均延时（单位：毫秒）</td>
    </tr>
    <tr>
        <td>kafka-lag</td><td>long</td><td>从 kafka-broker 到 selectdb-connect 中间阶段的平均延时（单位：毫秒）</td>
    </tr>
</table>

关于 Kafka Connect 默认的 JMX Metrics，可以参考：[Monitoring Kafka Connect and Connectors
](https://docs.confluent.io/kafka-connectors/self-managed/monitoring.html#monitoring-kconnect-long-and-connectors)