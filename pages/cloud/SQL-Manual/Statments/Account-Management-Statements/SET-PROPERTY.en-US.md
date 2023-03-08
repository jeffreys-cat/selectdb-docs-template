---
{
    "title": "SET-PROPERTY",
    "language": "en"
}
---

## SET-PROPERTY

### Name

SET PROPERTY

### Description

This command is used to set user attributes, including resources and import clusters assigned to users.

```sql
SET PROPERTY [FOR 'user'] 'key' = 'value' [, 'key' = 'value']
````

The user attributes here is set for a user instead of a `user_identity`. That is, if two users 'jack'@'%' and 'jack'@'192.%' are created through the CREATE USER statement, the SET PROPERTY statement can only be used for the user jack, instead of 'jack'@'% ' or 'jack'@'192.%'

key:

**Super user privileges:**

 max_user_connections: the maximum number of connections

 max_query_instances: the number of instances that a user can use to execute a query at a time

 sql_block_rules: set sql block rules. Once it is set, queries match these rules sent by the user will be rejected.

 cpu_resource_limit: limit the CPU resources for queries. See the introduction to the session variable `cpu_resource_limit` for details. -1 means not set.

 exec_mem_limit: limit the memory usage for queries. See the introduction to the session variable `exec_mem_limit` for details. -1 means not set.

 resource.cpu_share: CPU resource allocation (obsolete)

 load_cluster.{cluster_name}.priority: assign priority to the specified cluster, which can be HIGH or NORMAL

 resource_tags: specifies the user's resource tag privileges

 query_timeout: specifies the user's query timeout privileges

    Note: If the attributes `cpu_resource_limit`, `exec_mem_limit` are not set, the value in the session variable will be used by default.

**Ordinary user privileges:**

 quota.normal: resource allocation at the normal level

 quota.high: resource allocation at the high level

 quota.low: resource allocation at the low level

 load_cluster.{cluster_name}.hadoop_palo_path: the hadoop directory used by palo, which stores the etl program and its intermediate data generated for Doris to import. After the import, the intermediate data will automatically be cleaned up while the etl program will be retained for future usage.

 load_cluster.{cluster_name}.hadoop_configs: the configuration of hadoop, where fs.default.name, mapred.job.tracker, hadoop.job.ugi must be filled in.

 load_cluster.{cluster_name}.hadoop_http_port: hadoop hdfs name node http port. Where hdfs is set to 8070 and afs is set to 8010 by default.

 default_load_cluster: the default import cluster

### Example

1. Change the maximum number of connections to 1000 for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ````

2. Change the `cpu_share`  to 1000 for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'resource.cpu_share' = '1000';
   ````

3. Change the weight of normal group for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'quota.normal' = '400';
   ````

4. Add import cluster for user `jack`

   ```sql
   SET PROPERTY FOR 'jack'
       'load_cluster.{cluster_name}.hadoop_palo_path' = '/user/doris/doris_path',
       'load_cluster.{cluster_name}.hadoop_configs' = 'fs.default.name=hdfs://dpp.cluster.com:port;mapred.job.tracker=dpp.cluster.com:port;hadoop.job.ugi=user ,password;mapred.job.queue.name=job_queue_name_in_hadoop;mapred.job.priority=HIGH;';
   ````

5. Remove an import cluster for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'load_cluster.{cluster_name}' = '';
   ````

6. Change the default import cluster for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'default_load_cluster' = '{cluster_name}';
   ````

7. Change the cluster priority to HIGH for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'load_cluster.{cluster_name}.priority' = 'HIGH';
   ````

8. Change the number of available instances for user `jack`'s query to 3000

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ````

9. Modify the sql block rule for user `jack`

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ````

10. Modify the CPU usage limit for user `jack`

    ```sql
    SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
    ````

11. Modify the user's resource tag privileges

    ```sql
    SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
    ````

12. Modify the user's query memory usage limit (measured in bytes)

    ```sql
    SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
    ````

13. Modify the user's query timeout limit (measured in seconds)

    ```sql
    SET PROPERTY FOR 'jack' 'query_timeout' = '500';
    ````

### Keywords

    SET, PROPERTY

### Best Practice

