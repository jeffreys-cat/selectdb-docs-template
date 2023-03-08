# Release 1.2.1.1

发布日期：2023年1月18日

SelectDB 会提供自 Doris 1.2 发布（2022年12月7日） 起，长达12个月的长期支持（LTS），并发布 Bugfix 版本。 LTS 版本具备更高的稳定性，建议所有用户升级到这个版本。

## 重要功能

- 支持 hive metastore 元数据自动同步

	https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog/hive

- JDBC Catalog 支持 PostgreSQL，Oracle 和 Clickhouse

	https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog/jdbc

- Iceberg 表支持 Time Travel

	https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog/iceberg

- 支持 `split_by_string` 函数

	https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/string-functions/split_by_string

## 优化改进

- JDBC 外表支持 Array 类型
- 优化 IcebergV2 表的读取性能
- 支持HDFS 使用 Hadoop KMS 传输加密访问
- Multi-Catalog 支持 Hive 1.x
- 新增 Vertical Compaction 功能（默认关闭）（#15766）

## 问题修复

- 修复使用 JDBC Resource 创建 Catalog，可能导致无法生产元数据 Image的问题（#15919）
- 修复从 1.1.x 版本升级到 1.2.x 版本，元数据回放错误的问题 （#15706）
- 修复不支持访问 Kerberos 认证的 HDFS 的问题（#15753）
- 修复读取 CSV 数据性能劣化的问题。
- 修复创建 Rollup 导致 BE crash的问题（#15654）
- 修复 MOW Unqiue 表的若干数据正确性问题 (#15481, #14722，#15802)
- 修复 light schema change 的若干问题（#15681）
- 修复 in bitmap filter 的若干问题（#15494, #15532，#15779）
- 修复 Parquet 文件读取的若干问题（#15794）
- 修复 Spark Load 可能导致 BE OOM 的问题 (#15620)
