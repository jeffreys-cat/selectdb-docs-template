# BitSail SelectDB Sink
## 快速介绍
[BitSail](https://bytedance.github.io/bitsail/) 是一款基于分布式架构的高性能数据集成引擎，支持多种异构数据源间的数据同步。

## 版本支持
BitSail 0.1.0 以上，支持SelectDB Sink Connector。

## 使用方式
SelectDB写连接器参数在`job.writer`中配置，实际使用时请注意路径前缀。示例:
```json
{
  "job": {
    "writer": {
      "class": "com.bytedance.bitsail.connector.selectdb.sink.SelectdbSink",
      "load_url": "<your selectdb http hosts>",
      "jdbc_url": "<your selectdb mysql hosts>",
      "cluster_name": "<selectdb cluster name>",
      "user": "<user name>",
      "password": "<password>",
      "table_identifier": "<selectdb table identifier, like: test_db.test_selectdb_table>",
      "columns": [
        {
          "index": 0,
          "name": "id",
          "type": "int"
        },
        {
          "index": 1,
          "name": "bigint_type",
          "type": "bigint"
        },
        {
          "index": 2,
          "name": "string_type",
          "type": "varchar"
        },
        {
          "index": 3,
          "name": "double_type",
          "type": "double"
        },
        {
          "index": 4,
          "name": "date_type",
          "type": "date"
        }
      ]
    }
  }
}
```

## 配置项
### 必需参数

| 参数名称                    | 是否必填 | 参数含义                                                                         |
|:------------------------|:-----|:-----------------------------------------------------------------------------|
| class                   | 是    | Selectdb写连接器类型, `com.bytedance.bitsail.connector.selectdb.sink.SelectdbSink` |
| load_url                | 是    | Selectdb上传数据的HTTP URL                                                        |
| jdbc_url                | 是    | JDBC连接Selectdb的地址                                                            |
| cluster_name            | 是    | Selectdb cluster 的名称                                                         |
| user                    | 是    | Selectdb账户                                                                   |
| password                | 是    | Selectdb密码                                                                   |
| table_identifier        | 是    | 要写入Selectdb的库表，例如：test_db.test_select_table                                  |

### 可选参数

| 参数名称                   | 是否必填 | 参数枚举值             | 参数含义                                       |
|:-----------------------|:-----|:------------------|:-------------------------------------------|
| writer_parallelism_num | 否    |                   | 指定Selectdb写并发                              |
| sink_flush_interval_ms | 否    |                   | Upsert模式下的flush间隔, 默认5000 ms               |
| sink_max_retries       | 否    |                   | 写入的最大重试次数，默认3                              |
| sink_buffer_size       | 否    |                   | 写入buffer最大值，默认 1048576 bytes (1MB)         |
| sink_buffer_count      | 否    |                   | 初始化 buffer 的数量，默认为3                        |
| sink_enable_delete     | 否    |                   | 是否支持delete事件同步                             |
| sink_write_mode        | 否    | 目前仅支持BATCH_UPSERT | 写入模式                                       |
| stream_load_properties | 否    |                   | 追加在streamload url后的参数，map<string,string>格式 |
| load_contend_type      | 否    | csv<br/>json      | copy-into使用的格式，默认json                      |
| csv_field_delimiter    | 否    |                   | csv格式的行内分隔符, 默认逗号 ","                      |
| csv_line_delimiter     | 否    |                   | csv格式的行间分隔符, 默认 "\n"                       |
