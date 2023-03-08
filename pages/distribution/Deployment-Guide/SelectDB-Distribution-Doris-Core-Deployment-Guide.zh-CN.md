# SelectDB Distribution Core 安装手册

该文档主要面向**直接安装** SelectDB 发行版，我们建议您使用我们提供的 [Toolkit](https://cn.selectdb.com/dist-docs/%E7%AE%A1%E7%90%86%E6%8C%87%E5%8D%97/%E9%9B%86%E7%BE%A4%E7%AE%A1%E7%90%86/%E9%83%A8%E7%BD%B2%E9%9B%86%E7%BE%A4)  一键完成集群部署、扩容、缩容。

为了方便安装使用，发行包中内置了Java8，不需要单独安装Java。下载之后可以直接运行。

## 机器环境

### 概述

Apache Doris 能够运行在绝大多数主流的 Linux 服务器上。建议 Linux 选择较新的 CentOS 和 Ubuntu，然后 GCC 版本 4.8.2及以上。安装前，确保以下 Linux 系统相关设置。

#### 调大系统最大打开文件句柄数

```
vi /etc/security/limits.conf 
* soft nofile 65536
* hard nofile 65536
```

#### 调整vm.max_map_count的大小

```
vi /etc/sysctl.conf
加入一下内容
vm.max_map_count=2000000
然后执行使其生效
sysctl -p
```

#### 时钟同步

Doris 的元数据要求时间精度要小于5000ms，集群所有机器要进行时钟同步，避免因为时钟问题引发的元数据不一致导致服务出现异常。

#### 关闭交换分区（swap）

Linux交换分区会给 Doris 带来很严重的性能问题，需要禁用交换分区

### 开发测试环境

| 模块     | CPU  | 内存  | 磁盘               | 网络      | 实例数量 |
| -------- | ---- | ----- | ------------------ | --------- | -------- |
| Frontend | 8核+ | 8GB+  | SSD 或 SATA，10GB+ | 千兆网卡+ | 1        |
| Backend  | 8核+ | 16GB+ | SSD 或 SATA，50GB+ | 千兆网卡+ | 1-3      |

### 生产环境

| 模块     | CPU   | 内存  | 磁盘                   | 网络      | 实例数量 |
| -------- | ----- | ----- | ---------------------- | --------- | -------- |
| Frontend | 16核+ | 64GB+ | SSD 或 RAID 卡，100GB+ | 万兆网卡+ | 1-3      |
| Backend  | 16核+ | 64GB+ | SSD 或 SATA，100G+     | 万兆网卡+ | 3 +      |

注意：

1. FE 的磁盘空间主要用于存储元数据，包括日志和 image。大约占用几十GB。
2. BE 的磁盘空间主要用于存放数据，总磁盘空间按总数据量 * 3（3副本）计算，然后再预留额外 20% 的空间用作数据 compaction 以及一些中间数据的存放。
3. 一台机器上可以部署多个 BE 实例，但是建议只部署一个 FE。如果需要保证数据高可用，那么建议 3 台机器各部署一个 BE 实例（而不是1台机器部署3个 BE 实例）。
4. FE 角色分为 Follower 和 Observer，（Leader 为 Follower 组中选举出来的一种角色，以下统称 Follower）。
5. FE 节点数据至少为1（1 个 Follower）。如果需要提供读高可用，建议部署 1 个 Follower 和 1 个 Observer ；如果需要读写都要高可用时，则部署 3 个 Follower。

#### 网络需求

Doris 各个实例通过网络进行通讯。以下表格展示了所有需要的端口

| 实例名称 | 端口名称                | 默认端口 | 通讯方向                     | 说明                                                 |
| -------- | ----------------------- | -------- | ---------------------------- | ---------------------------------------------------- |
| BE       | be_port                 | 9060     | FE --> BE                    | BE 上 thrift server 的端口，用于接收来自 FE 的请求   |
| BE       | webserver_port          | 8040     | BE <--> BE                   | BE 上的 http server 的端口                           |
| BE       | heartbeat\_service_port | 9050     | FE --> BE                    | BE 上心跳服务端口（thrift），用于接收来自 FE 的心跳  |
| BE       | brpc\_port              | 8060     | FE <--> BE, BE <--> BE       | BE 上的 brpc 端口，用于 BE 之间通讯                  |
| FE       | http_port               | 8030     | FE <--> FE，用户 <--> FE     | FE 上的 http server 端口                             |
| FE       | rpc_port                | 9020     | BE --> FE, FE <--> FE        | FE 上的 thrift server 端口，每个fe的配置需要保持一致 |
| FE       | query_port              | 9030     | 用户 <--> FE                 | FE 上的 mysql server 端口                            |
| FE       | edit\_log_port          | 9010     | FE <--> FE                   | FE 上的 bdbje 之间通信用的端口                       |
| Broker   | broker\_ipc_port        | 8000     | FE --> Broker, BE --> Broker | Broker 上的 thrift server，用于接收请求              |

> 注：当部署多个 FE 实例时，要保证 FE 的 http\_port 配置相同。
>

#### IP 绑定

因为有多网卡的存在，或因为安装过 docker 等环境导致的虚拟网卡的存在，同一个主机可能存在多个不同的 ip。当前 Doris 并不能自动识别可用 IP。所以当遇到部署主机上有多个 IP 时，必须通过 priority\_networks 配置项来强制指定正确的 IP。

priority\_networks 是 FE 和 BE 都有的一个配置，配置项需写在 fe.conf 和 be.conf 中。该配置项用于在 FE 或 BE 启动时，告诉进程应该绑定哪个IP。示例如下：

`priority_networks=172.16.21.0/24`

这是一种 [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) 的表示方法。FE 或 BE 会根据这个配置项来寻找匹配的IP，作为自己的服务监听IP。

**注意**：当配置完 priority\_networks 并启动 FE 或 BE 后，只是保证了 FE 或 BE 自身的 IP 进行了正确的绑定。而在使用 ADD BACKEND 或 ADD FRONTEND 语句中，也需要指定和 priority\_networks 配置匹配的 IP，否则集群无法建立。举例：

BE 的配置为：`priority_networks=172.16.21.0/24`

但是在 ADD BACKEND 时使用的是：

```sql
ALTER SYSTEM ADD BACKEND "172.16.1.12:9050";
```

则 FE 和 BE 将无法正常通信。

这时，必须 DROP 掉这个添加错误的 BE，重新使用正确的 IP 执行 ADD BACKEND。

FE 同理。

BROKER 当前没有，也不需要 priority\_networks 这个选项。Broker 的服务默认绑定在 0.0.0.0 上。只需在 ADD BROKER 时，添加正确可访问的 BROKER IP 即可。

## 集群部署

首先下载SelectDB Distribution for Apache Doris 安装包，

下载下来的包名类似：selectdb_doris_x.x.x.x-x86_64-avx2.tar.gz

解压安装包：

```
tar zxf selectdb_doris_x.x.x.x-x86_64-avx2.tar.gz
```

解压后的目录包含以下内容 

```
selectdb_doris_x.x.x.x-x86_64-avx2
|-- README.md             ## 发行包说明文档
|-- apache_hdfs_broker    ## FS_Broker
|-- audit_loader          ## 审计日志插件
|-- be                    ## Doris be
|-- fe                    ## Doris FE
|-- java8                 ## Doris FE/BE/Broker 运行所依赖的 Java 运行环境
|-- jdbc_drivers          ## Doris FE/BE JDBC 外表及Muitl Catalog 运行所依赖的数据库驱动 
`-- udf
```

#### FE 部署

* 拷贝上面解压的文件夹到指定节点

  如果只是单独部署 FE ，而不部署其他服务，可以只保留这个文件夹下的 fe、java8 及 jdbc_drivers，其他目录可以删除

* 配置 FE

  1. 配置文件为 conf/fe.conf。其中注意：`meta_dir`是元数据存放位置。默认值为 `${DORIS_HOME}/doris-meta`。需**手动创建**该目录。

     **注意：生产环境强烈建议单独指定目录不要放在Doris安装目录下，最好是单独的磁盘（如果有SSD最好），测试开发环境可以使用默认配置**

  2. fe.conf 中 JAVA_OPTS 默认 java 最大堆内存为 8GB，**建议根据机器内存大小做相应调整**。

* 启动FE

  `bin/start_fe.sh --daemon`

  FE进程启动进入后台执行。日志默认存放在 log/ 目录下。如启动失败，可以通过查看 log/fe.log 或者 log/fe.out 查看错误信息。

* 查看 FE 运行状态

  使用 mysql-client 连接到 FE，并执行 下面命令来查看 BE 的运行情况

  ```SQL
  SHOW FRONTENDS;
  ```

​       如一切正常，`isAlive` 列应为 `true`。

* 如需部署多 FE，请参见 [弹性扩缩容](https://doris.apache.org/zh-CN/docs/dev/admin-manual/cluster-management/elastic-expansion/)

#### BE 部署

* 拷贝上面解压的文件夹到指定节点

  如果只是单独部署 BE ，而不部署其他服务，可以只保留这个文件夹下的 be、java8 及 jdbc_drivers 其他目录可以删除

* 修改所有 BE 的配置

  修改 be/conf/be.conf。主要是配置 `storage_root_path`：数据存放目录。默认在be/storage下，需要**手动创建**该目录。多个路径之间使用英文状态的分号 `;` 分隔（**最后一个目录后不要加 `;`**）。  
  可以通过路径区别存储目录的介质，HDD或SSD。可以添加容量限制在每个路径的末尾，通过英文状态逗号`,`隔开。如果用户不是SSD和HDD磁盘混合使用的情况，不需要按照如下示例一和示例二的配置方法配置，只需指定存储目录即可。

  示例一如下：

  **注意：如果是SSD磁盘要在目录后面加上`.SSD`,HDD磁盘在目录后面加`.HDD`**

  `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

  **说明**

    - /home/disk1/doris.HDD ： 表示存储介质是HDD;
    - /home/disk2/doris.SSD： 表示存储介质是SSD；
    - /home/disk2/doris： 表示存储介质是HDD（默认）

  示例二如下：

  **注意：不论HDD磁盘目录还是SSD磁盘目录，都无需添加后缀，storage_root_path参数里指定medium即可**

  `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

  **说明**

    - /home/disk1/doris,medium:hdd： 表示存储介质是HDD;
    - /home/disk2/doris,medium:ssd： 表示存储介质是SSD;

* 在 FE 中添加所有 BE 节点

  BE 节点需要先在 FE 中添加，才可加入集群。可以使用 mysql-client连接到 FE：

  ```sql
  ./mysql-client -h fe_host -P query_port -uroot
  ```

  其中 `fe_host` 为 FE 所在节点 ip；`query_port` 在 `fe/conf/fe.conf` 中的；默认使用 root 账户，无密码登录。

  登录后，执行以下命令来添加每一个 BE：

  ```sql
  ALTER SYSTEM ADD BACKEND "be_host:heartbeat-service_port"
  ```

  其中 `be_host` 为 BE 所在节点 ip；`heartbeat_service_port` 在 `be/conf/be.conf` 中。

* 启动 BE

  ```
  bin/start_be.sh --daemon
  ```

  BE 进程将启动并进入后台执行。日志默认存放在 be/log/ 目录下。如启动失败，可以通过查看 `be/log/be.log` 或者 `be/log/be.out` 查看错误信息。

* 查看BE状态

  使用 mysql-client 连接到 FE，并执行 下面命令来查看 BE 的运行情况

  ```sql
  SHOW BACKENDS;
  ```

  如一切正常，`isAlive` 列应为 `true`。

#### FS_Broker 部署（可选组件）

Broker 以插件的形式，独立于 Doris 部署。如果需要从第三方存储系统导入数据，需要部署相应的 Broker，默认提供了读取 HDFS 、对象存储的 fs_broker。fs_broker 是无状态的，建议每一个 FE 和 BE 节点都部署一个 Broker。

如果是和 fe 和 be 节点部署在一起只需要在上面解压的目录下的文件夹下，将 `apache_hdfs_broker` 文件夹保留即可。

* 修改相应 Broker 配置

  在相应 broker/conf/ 目录下对应的配置文件中，可以修改相应配置。

* 启动 Broker

  ```
  sh bin/start_broker.sh --daemon
  ```

* 添加 Broker

  要让 Doris 的 FE 和 BE 知道 Broker 在哪些节点上，通过 sql 命令添加 Broker 节点列表。

  使用 mysql-client 连接启动的 FE，执行以下命令：

  ```sql
  ALTER SYSTEM ADD BROKER broker_name "broker_host1:broker_ipc_port1","broker_host2:broker_ipc_port2",...;
  ```

  其中 broker_host 为 Broker 所在节点 ip；broker_ipc_port 在 Broker 配置文件中的conf/apache_hdfs_broker.conf。

* 查看 Broker 状态

  使用 mysql-client 连接任一已启动的 FE，执行以下命令查看 Broker 状态：

  ```sql
  SHOW PROC "/brokers";
  ```

  

