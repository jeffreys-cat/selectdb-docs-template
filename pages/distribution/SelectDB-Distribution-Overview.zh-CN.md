# SelectDB Distribution 介绍

SelectDB Distribution for Apache Doris 是 SelectDB 为 Apache Doris 提供的预构建分发版。100% 免费和源码开放，与社区版本完全兼容。

我们推荐在 **物理机、虚拟机或容器**中使用 SelectDB Doris 分发版，以获得比社区版本更好的运维、开发体验，以及更强的安全、稳定性支持。

## 核心特色

* **长周期版本支持** ：每半年发布一个长达12个月的 LTS 版本，每个月定期发布 bugfix 版本。
* **运维与开发工具** ：为数据库日常运维提供相应的管理工具，为数据库开发提供相应的开发工具。
* **更好的打包** ：将依赖的 Java 环境、周边工具、各种 Connector 和 Doris 内核等一起打包，方便安装使用。
* **提供付费技术支持** ：提供更加专业的付费技术支持，解决生产环境使用 Doris 的后顾之忧。

## 组成部分

* **SelectDB Distribution Core：** 包含 Java 环境、各种 Connector 以及 Apache Doris 内核，提供 X64、ARM64 版本，并提供长达12个月支持的 LTS 版本。
* **SelectDB Distribution Toolkit :**
  * **集群运维工具：** 基于 Doris 深度定制的集群运维命令行工具，其功能包含部署集群、版本升级、监控、自助巡检等，方便用户自助运维集群。
  * **数据开发工具：** 与 Doris 深度融合的数据开发平台，协助用户管理、探索数据并进行权限管理，可以替代 Navicat。

以上组成部分均可在 SelectDB Doris 分发版官网 [免费下载](https://cn.selectdb.com/distribution#download)。

## 与 Apache Doris 的兼容性

SelectDB Doris 分发版代码基于 Apache Doris，与 Doris 社区版**完全兼容** ，可以**互相迁移**。 在社区更新后，SelectDB 也会提供对应的分发版，以保证跟进最新的功能和优化。

