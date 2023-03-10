---
{
    "title": "CREATE-RESOURCE",
    "language": "en"
}
---

## CREATE-RESOURCE

### Name

CREATE RESOURCE

### Description

This statement is used to create a resource. Only the root or admin user can create resources. Currently supports Spark, ODBC, S3 external resources. In the future, other external resources may be added to Doris for use, such as Spark/GPU for query, HDFS/S3 for external storage, MapReduce for ETL, etc.

Syntax:

```sql
CREATE [EXTERNAL] RESOURCE "resource_name"
PROPERTIES ("key"="value", ...);
````

Note:

- The type of resource needs to be specified in PROPERTIES "type" = "[spark|odbc_catalog|s3]", currently supports spark, odbc_catalog, s3.
- PROPERTIES differs depending on the resource type, see the example for details.

### Example

1. Create a Spark resource named spark0 in yarn cluster mode.

   ```sql
   CREATE EXTERNAL RESOURCE "spark0"
   PROPERTIES
   (
     "type" = "spark",
     "spark.master" = "yarn",
     "spark.submit.deployMode" = "cluster",
     "spark.jars" = "xxx.jar,yyy.jar",
     "spark.files" = "/tmp/aaa,/tmp/bbb",
     "spark.executor.memory" = "1g",
     "spark.yarn.queue" = "queue0",
     "spark.hadoop.yarn.resourcemanager.address" = "127.0.0.1:9999",
     "spark.hadoop.fs.defaultFS" = "hdfs://127.0.0.1:10000",
     "working_dir" = "hdfs://127.0.0.1:10000/tmp/doris",
     "broker" = "broker0",
     "broker.username" = "user0",
     "broker.password" = "password0"
   );
   ````

   Spark related parameters are as follows:
   - spark.master: Required, currently supports yarn, spark://host:port.
   - spark.submit.deployMode: The deployment mode of the Spark program, required, supports both cluster and client.
   - spark.hadoop.yarn.resourcemanager.address: Required when master is yarn.
   - spark.hadoop.fs.defaultFS: Required when master is yarn.
   - Other parameters are optional, refer to [here](http://spark.apache.org/docs/latest/configuration.html)

   

   Working_dir and broker need to be specified when Spark is used for ETL. described as follows:

   - working_dir: The directory used by the ETL. Required when spark is used as an ETL resource. For example: hdfs://host:port/tmp/doris.
   - broker: broker name. Required when spark is used as an ETL resource. Configuration needs to be done in advance using the `ALTER SYSTEM ADD BROKER` command.
   - broker.property_key: The authentication information that the broker needs to specify when reading the intermediate file generated by ETL.

2. Create an ODBC resource

   ```sql
   CREATE EXTERNAL RESOURCE `oracle_odbc`
   PROPERTIES (
   "type" = "odbc_catalog",
   "host" = "192.168.0.1",
   "port" = "8086",
   "user" = "test",
   "password" = "test",
   "database" = "test",
   "odbc_type" = "oracle",
   "driver" = "Oracle 19 ODBC driver"
   );
   ````

   The relevant parameters of ODBC are as follows:
   - hosts: IP address of the external database
   - driver: The driver name of the ODBC appearance, which must be the same as the Driver name in be/conf/odbcinst.ini.
   - odbc_type: the type of the external database, currently supports oracle, mysql, postgresql
   - user: username of the foreign database
   - password: the password information of the corresponding user
   - charset: connection charset
   - There is also support for implementing custom parameters per ODBC Driver, see the description of the corresponding ODBC Driver

4. Create S3 resource

   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "AWS_ENDPOINT" = "bj.s3.com",
      "AWS_REGION" = "bj",
      "AWS_ACCESS_KEY" = "bbb",
      "AWS_SECRET_KEY" = "aaaa",
      -- the followings are optional
      "AWS_MAX_CONNECTIONS" = "50",
      "AWS_REQUEST_TIMEOUT_MS" = "3000",
      "AWS_CONNECTION_TIMEOUT_MS" = "1000"
   );
   ```

   If S3 resource is used for [cold hot separation](../../../../../docs/advanced/cold_hot_separation.md), we should add more required fields.
   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "AWS_ENDPOINT" = "bj.s3.com",
      "AWS_REGION" = "bj",
      "AWS_ACCESS_KEY" = "bbb",
      "AWS_SECRET_KEY" = "aaaa",
      -- required by cooldown
      "AWS_ROOT_PATH" = "/path/to/root",
      "AWS_BUCKET" = "test-bucket",
   );
   ```

   S3 related parameters are as follows:
   - Required parameters
       - `AWS_ENDPOINT`: s3 endpoint
       - `AWS_REGION`: s3 region
       - `AWS_ROOT_PATH`: s3 root directory
       - `AWS_ACCESS_KEY`: s3 access key
       - `AWS_SECRET_KEY`: s3 secret key
       - `AWS_BUCKET`: s3 bucket
   - optional parameter
       - `AWS_MAX_CONNECTIONS`: the maximum number of s3 connections, the default is 50
       - `AWS_REQUEST_TIMEOUT_MS`: s3 request timeout, in milliseconds, the default is 3000
       - `AWS_CONNECTION_TIMEOUT_MS`: s3 connection timeout, in milliseconds, the default is 1000

### Keywords

    CREATE, RESOURCE

### Best Practice
