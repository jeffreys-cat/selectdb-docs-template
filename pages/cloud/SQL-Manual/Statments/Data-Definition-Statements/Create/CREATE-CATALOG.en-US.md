---
{
    "title": "CREATE-CATALOG",
    "language": "en"
}
---

## CREATE-CATALOG

### Name

CREATE CATALOG

### Description

This statement is used to create an external catalog

Syntax:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
    [PROPERTIES ("key"="value", ...)];
```

`PROPERTIES` is the connection information for the catalog. The "type" attribute must be specified, currently supports:

* hms：Hive MetaStore
* es：Elasticsearch
* jdbc: Database access standard interface (JDBC), currently only support `jdbc:mysql`

### Example

1. Create catalog hive

   ```sql
   CREATE CATALOG hive PROPERTIES (
		"type"="hms",
		'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
		'dfs.nameservices'='HDFS8000871',
		'dfs.ha.namenodes.HDFS8000871'='nn1,nn2',
		'dfs.namenode.rpc-address.HDFS8000871.nn1'='172.21.0.2:4007',
		'dfs.namenode.rpc-address.HDFS8000871.nn2'='172.21.0.3:4007',
		'dfs.client.failover.proxy.provider.HDFS8000871'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
	);
	```

2. Create catalog es

   ```sql
   CREATE CATALOG es PROPERTIES (
	   "type"="es",
	   "elasticsearch.hosts"="http://127.0.0.1:9200"
   );
   ```

### Keywords

CREATE, CATALOG

### Best Practice

