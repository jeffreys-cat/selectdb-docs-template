# SelectDB Distribution Toolkit 管理指南

SelectDB Distribution Toolkit 是 SelectDB 提供的集群管理与数据开发工具，可以简单快捷的管理 Doris 集群，支持集群部署、查看、启停、扩容等常用操作。本文将详细介绍 dorisctrl 的详细使用。

## 集群操作

### 部署集群

通过 `cluster deploy` 命令，可以部署新的 Doris 集群。具体部署过程如下：

- 首先，需要配置集群拓扑文件，提供部署新集群的参数信息。你可以执行如下命令，生成简易版的集群拓扑文件样例，然后按需调整：

```Shell
dorisctrl cluster template > doris-topo.yaml
```

```shell
# common configuration of all frontends and backends
global:
    user: root
    ssh_port: 22
    deploy_dir: /opt/selectdb
    data_dir: /data/selectdb

# simple configuration of frontends. For detailed configuration, refer to the full template
frontends:
  - host: 192.168.88.31
  - host: 192.168.88.32
  - host: 192.168.88.33

# simple configuration of backends. For detailed configuration, refer to the full template
backends:
  - host: 192.168.88.31
  - host: 192.168.88.32
  - host: 192.168.88.33
```

也可通过 dorisctrl cluster template --full 命令，生成详细版的集群拓扑文件样例。

- 然后，指定集群名和内核安装包版本，执行如下命令，自动完成集群的部署过程：

```Shell
dorisctrl cluster deploy <cluster_name> -v <version> -f <topology_file>
```

```shell
> dorisctrl cluster deploy doris-test -v 1.2.1.1 -f doris-c2.yaml

INFO[2022-11-20 16:06:16] init cluster config
INFO[2022-11-20 16:06:16] succeed to read config file from doris-c2.yaml
INFO[2022-11-20 16:06:16] deploying cluster [doris-test]
Please enter password of the remote hosts to set up ssh authentication: 
INFO[2022-11-20 16:06:20] run shell : ssh-keygen -t rsa -f  /home/selectdb/.dorisctrl/ssh/id_rsa -P '' -N '' -C 'selectdb_keygen'
INFO[2022-11-20 16:06:20] make ssh keygen success: Generating public/private rsa key pair.
...
INFO[2022-11-20 16:07:40] succeed to customize node configs
INFO[2022-11-20 16:07:40] succeed to deploy cluster, ready to launch
```

### 查看集群详情

通过 `cluster display` 命令，可以查看指定集群的详细信息。

```Shell
dorisctrl cluster display <cluster_name>
```

```shell
> dorisctrl cluster display doris-test
INFO[2022-11-20 16:05:45] start to fetch node status of cluster [doris-test]
ID                   ROLE    HOST                  QUERY PORT       HTTP PORT        STAT        DEPLOYDIR
-------------------- ------  --------------------  ---------------  ---------------  ----------  --------------------------------------------------
192.168.88.41:9010   FE      192.168.88.41         9030             8030             UP/L        /opt/selectdb/fe
192.168.88.42:9010   FE      192.168.88.42         9030             8030             UP          /opt/selectdb/fe
192.168.88.43:9010   FE      192.168.88.43         9030             8030             UP          /opt/selectdb/fe
192.168.88.41:9050   BE      192.168.88.41         -                8040             UP          /opt/selectdb/be
192.168.88.42:9050   BE      192.168.88.42         -                8040             UP          /opt/selectdb/be
192.168.88.43:9050   BE      192.168.88.43         -                8040             UP          /opt/selectdb/be
```

### 查看集群列表

通过 `cluster list` 命令，可以查看 dorisctrl 管理的所有集群。

```Shell
dorisctrl cluster list
```

```shell
> dorisctrl cluster list
ClusterName      Version     User        CreateDate               
---------------  ----------  ----------  -------------------------
doris-test       1.2.0       root        2023-01-08T21:13Z    
doris-demo       1.2.0       root        2023-01-08T22:10Z      
```

### 启动集群

通过 `cluster start` 命令，可以启动指定集群中的节点。

#### **启动集群中所有的节点**

通过以下命令可以启动指定集群下的所有节点：

```Shell
dorisctrl cluster start <cluster_name>
```

```shell
> dorisctrl cluster start doris-test

INFO[2022-11-20 16:24:03] starting cluster [doris-test]
INFO[2022-11-20 16:24:03] starting FE cluster
INFO[2022-11-20 16:24:03] starting FE node [192.168.88.31:9010]         editLog=9010 feHost=192.168.88.31
INFO[2022-11-20 16:24:03] FE node started                               editLog=9010 feHost=192.168.88.31
INFO[2022-11-20 16:24:03] starting FE node [192.168.88.32:9010]         editLog=9010 feHost=192.168.88.32
INFO[2022-11-20 16:24:03] FE node started                               editLog=9010 feHost=192.168.88.32
INFO[2022-11-20 16:24:03] starting FE node [192.168.88.33:9010]         editLog=9010 feHost=192.168.88.33
INFO[2022-11-20 16:24:03] FE node started                               editLog=9010 feHost=192.168.88.33
INFO[2022-11-20 16:24:03] succeed to start FE cluster
INFO[2022-11-20 16:24:03] starting BE cluster
INFO[2022-11-20 16:24:03] starting BE node [192.168.88.31:9050]         beHost=192.168.88.31 heartBeat=9050
INFO[2022-11-20 16:24:09] succeed to run command to start BE node       beHost=192.168.88.31 heartBeat=9050
INFO[2022-11-20 16:24:09] starting BE node [192.168.88.32:9050]         beHost=192.168.88.32 heartBeat=9050
INFO[2022-11-20 16:24:14] succeed to run command to start BE node       beHost=192.168.88.32 heartBeat=9050
INFO[2022-11-20 16:24:14] starting BE node [192.168.88.33:9050]         beHost=192.168.88.33 heartBeat=9050
INFO[2022-11-20 16:24:20] succeed to run command to start BE node       beHost=192.168.88.33 heartBeat=9050
INFO[2022-11-20 16:24:20] succeed to start BE cluster
INFO[2022-11-20 16:24:20] succeed to start cluster [doris-test]
```

#### **启动集群中指定角色的节点**

通过 `-r` 指令，可以启动集群中指定角色的节点。

- 通过以下命令可以启动集群中所有 FE 节点：

```Shell
dorisctrl cluster start <cluster_name> -r FE
```

- 通过以下命令可以启动集群中所有 BE 节点：

```Shell
dorisctrl cluster start <cluster_name> -r BE
```

#### **启动集群中指定 ID 的节点**

通过 `-i` 指令，可以启动指定节点。通过 `display` 命令可以查看节点 node_id。

```Shell
dorisctrl cluster start <cluster_name> -i <node_id>
```

### 停止集群

#### **停止集群中所有的节点**

通过以下命令可以停止指定集群中的所有节点：

```Shell
dorisctrl cluster stop <cluster_name>
```

```shell
> dorisctrl cluster stop doris-test
INFO[2022-11-20 17:13:30] stopping cluster [doris-test]
INFO[2022-11-20 17:13:30] stopping FE cluster
INFO[2022-11-20 17:13:30] stopping FE node [192.168.88.31:9010]         editLogPort=9010 feHost=192.168.88.31
INFO[2022-11-20 17:13:30] succeed to run command to stop FE node        editLogPort=9010 feHost=192.168.88.31
INFO[2022-11-20 17:13:30] stopping FE node [192.168.88.32:9010]         editLogPort=9010 feHost=192.168.88.32
INFO[2022-11-20 17:13:31] succeed to run command to stop FE node        editLogPort=9010 feHost=192.168.88.32
INFO[2022-11-20 17:13:31] stopping FE node [192.168.88.33:9010]         editLogPort=9010 feHost=192.168.88.33
INFO[2022-11-20 17:13:31] succeed to run command to stop FE node        editLogPort=9010 feHost=192.168.88.33
INFO[2022-11-20 17:13:31] succeed to stop FE cluster
INFO[2022-11-20 17:13:31] stop to stop BE cluster
INFO[2022-11-20 17:13:31] stopping BE node [192.168.88.31:9050]...      beHost=192.168.88.31 heartbeatPort=9050
INFO[2022-11-20 17:13:31] succeed to run command to stop BE node        beHost=192.168.88.31 heartbeatPort=9050
INFO[2022-11-20 17:13:31] stopping BE node [192.168.88.32:9050]...      beHost=192.168.88.32 heartbeatPort=9050
INFO[2022-11-20 17:14:35] succeed to run command to stop BE node        beHost=192.168.88.32 heartbeatPort=9050
INFO[2022-11-20 17:14:35] stopping BE node [192.168.88.33:9050]...      beHost=192.168.88.33 heartbeatPort=9050
INFO[2022-11-20 17:14:35] succeed to run command to stop BE node        beHost=192.168.88.33 heartbeatPort=9050
INFO[2022-11-20 17:14:35] succeed to stop BE cluster
INFO[2022-11-20 17:14:35] cluster [doris-test] stopped
```

#### **停止集群中指定角色的节点**

通过以下命令可以停止集群中指定角色的节点

- 通过以下命令可以停止集群中所有 FE 节点：

```Shell
dorisctrl cluster stop <cluster_name> -r FE
```

- 通过以下命令可以停止集群中所有 BE 节点：

```Shell
dorisctrl cluster stop <cluster_name> -r BE
```

#### **停止集群中指定 ID 的节点**

通过 `-i` 指令，可以停止指定节点。通过 `display` 命令可以查看节点 node_id。

```Shell
dorisctrl cluster stop <cluster_name> -i <node_id>
```

### 扩容集群

通过 cluster scale-out 命令，进行集群扩容。

注意，这里的集群配置信息需要在现有集群的配置信息之上增加新节点。

```Shell
dorisctrl cluster scale-out <cluster_name> -f <cluster_conf>
```

### 托管集群

通过 cluster import 可以托管已有的集群：

```Shell
dorisctrl cluster import <cluster_name> -f <config_file>
```

其中，config_file文件中包含了已有集群所在机器的账号和一个FE节点的配置等信息，dorisctrl 会自动抓取集群节点信息并实现托管。
> **注意** YAML 文件中 global user 配置项，用户必须与启动集群的 Linux 用户一致，或者使用 root 用户。

```YAML
# common configuration of all frontends and backends
global:
    user: selectdb 
    ssh_port: 22

# one FE nodes that access Doris HTTP interface for cluster information
frontends:
  - host:  127.0.0.2 
    http_port: 8030
```

## Studio 操作

### 部署 Studio

通过 `studio deploy`，可以在指定节点部署 Studio。

```Shell
dorisctrl studio deploy -f <studio_config>
```

可以通过 `dorisctrl studio template` 命令输出 studio_config 样例配置，如下：

```YAML
# specify which host to install the studio service.
target_host:
  host: localhost 
  ssh_port: 22
  user: root

# configurations of studio and its deps.
studio:
  deploy_dir: /opt/selectdb
  data_dir: /data/selectdb
  http_port: 8003
  
# optional, the mail server used by studio to send notifications.  
# mail_config:
#   host: mailserver.com
#   username: name@company.com
#   password: Pass123456
#   port: 25
#   protocol: smtp
```

### 启动 Studio

通过 `studio start` 可以启动 Studio。

```Shell
dorisctrl studio start
```

### Studio 加载集群

通过 `studio reload` 可以将集群加载至 Studio。该步骤会注册集群地址到 Studio 中，并开始采集监控。完成后就可以在 Studio 的 WebUi 界面上，使用 Doris 的账户密码登录并访问集群。

```Shell
dorisctrl studio reload <cluster_name>
```

> **注**：当对集群进行启停、扩容等改变集群状态的操作时，需要手动进行 studio reload 重新加载当前集群的状态，来保证集群查询和监控告警功能的可用。

### Studio 卸载集群

如果不希望 Studio 继续访问某个集群，可以通过 `studio unload` 来卸载该集群，具体命令如下所示。

```Shell
dorisctrl studio unload <cluster_name>
```

### 停止 Studio

通过 `studio stop` 可以停止 Studio。

```Shell
dorisctrl studio stop
```
