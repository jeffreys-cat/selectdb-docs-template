# SelectDB Distribution Toolkit 安装手册

SelectDB Distribution Toolkit 是 SelectDB 提供的集群管理与数据开发工具，可以简单快捷的管理 Doris 集群，支持集群部署、查看、启停、扩容等常用操作。本文将详细介绍 dorisctrl 的安装方式。

## 安装 dorisctrl

通过 [链接](https://cn.selectdb.com/distribution#download) 下载 SelectDB Distribution Toolkit 压缩包，上传中控机并解压：

```PowerShell
mkdir -p /data/download
tar zxf selectdb_distribution_toolkit-1.2.1-x86_64.tar.gz -C /data/download/
```

进入解压后的子目录，验证是否安装成功：

```PowerShell
cd /data/download/selectdb_doris_toolkit-1.2.1-x86_64/dorisctrl/bin
./dorisctrl -h 
```

> **提示** 可以将 dorisctrl 所在路径放入 PATH 环境变量中，方便日常操作。本文后续部分采用此种方式进行演示。

### 设置内核安装源

在使用 dorisctrl 管理 Doris 集群过程中，会依赖 SelectDB Distribution Core 安装包。由于在用户部署环境中，中控机可能无法访问公网下载安装包，因此 dorisctrl 支持通过`repo` 命令，设置采用不同方式的安装源：

- **本地目录方式**
  -  采用本地目录作为内核安装包的来源。这种方式下，你需要通过 [链接](https://cn.selectdb.com/distribution#download) 手动下载内核安装包，放在中控机的本地目录中，然后通过 `dorisctrl repo file:///<selectdb_download_dir>` 修改安装源为本地目录，如下所示：

```PowerShell
dorisctrl repo file:///data/download
```

- **镜像源方式**
  -  采用镜像源作为内核安装包的来源。如果中控机可以访问公网，可使用 SelectDB 提供的默认镜像源即可，无需修改。如果用户内网中有文件服务器，也可以把内核安装包放在其中，并通过 `dorisctrl repo http://<internal_http_repo>`命令修改镜像源，如下所示：

```Shell
dorisctrl repo http://192.168.88.80:9000/selectdb-doris
```

> **注意** 本文档涉及两个安装包，分别是 SelectDB Distribution Toolkit 安装包 和 SelectDB Distribution Core 安装包，注意区分。
