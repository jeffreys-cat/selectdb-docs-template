# SeaTunnel SelectDB Sink

SeaTunnel SelectDB Sink 支持通过 SeaTunnel 将上游的数据写入到SelectDB中。

## 版本支持

SeaTunnel 2.3.1以上，支持connector-v2中的Flink、Spark以及STEngine

## 使用方法

### Json写入

```
sink {
  SelectDBCloud {
    load-url="warehouse_ip:http_port"
    jdbc-url="warehouse_ip:mysql_port"
    cluster-name="Cluster"
    table.identifier="test.test"
    username="admin"
    password="******"
    selectdb.config {
        file.type="json"
        file.strip_outer_array="false"
    }
  }
}
```
### CSV写入

```
sink {
  SelectDBCloud {
    load-url="warehouse_ip:http_port"
    jdbc-url="warehouse_ip:mysql_port"
    cluster-name="Cluster"
    table.identifier="test.test"
    username="admin"
    password="******"
    selectdb.config {
        file.type='csv' 
        file.column_separator=',' 
        file.line_delimiter='\n' 
    }
  }
}
```

## 配置项

| name                | type   | **Required** | **defaultvalue** | **Description**                                                                                                                                                                    |
|---------------------|--------|--------------|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| load-url            | string | Y            | -                | SelectDB Cloud warehouse http地址，格式为warehouse_ip:http_port                                                                                                                          |
| jdbc-url            | string | Y            | -                | SelectDB Cloud warehouse jdbc地址，格式为warehouse_ip:mysql_port                                                                                                                         |
| cluster-name        | string | Y            | -                | SelectDB Cloud 集群名称                                                                                                                                                                |
| username            | string | Y            | -                | SelectDB Cloud 用户名                                                                                                                                                                 |
| password            | string | Y            | -                | SelectDB Cloud 密码                                                                                                                                                                  |
| table.identifier    | string | Y            | -                | 写入的表，例：db.table                                                                                                                                                                    |
| selectdb.config     | map    | Y            | -                | 写入属性配置 CSV 写入： selectdb.config { file.type='csv' file.column_separator=',' file.line_delimiter='\n' } JSON 写入: selectdb.config { file.type="json" file.strip_outer_array="false" } |
| sink.buffer-size    | int    | N            | 1024*1024 (1MB)  | 写数据缓存buffer大小，单位字节。默认1MB，不建议修改。                                                                                                                                                    |
| sink.buffer-count   | int    | N            | 3                | 写数据缓存buffer个数，默认3，不建议修改。                                                                                                                                                           |
| sink.max-retries    | int    | N            | 1                | Commit阶段的最大重试次数，默认1次                                                                                                                                                               |
| sink.check-interval | int    | N            | 10000            | 定期写文件的间隔，单位毫秒，默认10秒，不建议修改。                                                                                                                                                                |
