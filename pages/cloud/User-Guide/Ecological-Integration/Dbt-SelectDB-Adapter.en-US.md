# DBT SelectDB Adapter

[DBT (Data Build Tool)](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://docs.getdbt.com/docs/introduction) is a component that focuses on T (Transform) in ELT (extraction, loading, transformation) - "transforming data". The dbt-selectdb adapter is developed based on dbt-core 1.3.0 and depends on mysql -connector-python driver performs data conversion on selectdb.

## Version support

| selectdb/doris    | python       | dbt-core |
| ----------------- | ------------ | -------- |
| >=2.0.0 / >=1.1.0 | >=3.8,<=3.10 | >=1.3.0  |

## Dbt-selectdb adapter uses

### Install dbt-selectdb adapter

Install using pip:

```shell
pip install dbt-selectdb
```

The installation behavior will install all dbt running dependencies by default, you can use the following command to check and verify:

```shell
dbt --version
```

If the system does not recognize the dbt command, you can create a soft link:

```shell
ln -s /usr/local/python3/bin/dbt /usr/bin/dbt
```

### Init dbt-selectdb adapter

```shell
dbt init 
```

A query command line will appear, enter the corresponding configuration as follows to initialize a dbt project:

| name     | Defaults | meaning                                                      |
| -------- | -------- | ------------------------------------------------------------ |
| project  |          | Item name                                                    |
| project  |          | Item name                                                    |
| database |          | Enter the corresponding number to select the adapter (select doris) |
| host     |          | Select the host of db fe                                     |
| port     | 9030     | query_port of selectdb fe                                    |
| schema   |          | In dbt-selectdb, it is equivalent to database, library name  |
| username |          | selectdb username                                            |
| password |          | The password of selectdb, if not set, just press Enter       |
| threads  | 1        | Parallelism in dbt-selectdb (setting a parallelism that does not match the cluster capability will increase the risk of dbt running failure) |

### Run dbt-selectdb adapter

For relevant dbt operation documents, please refer to [here](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://docs.getdbt.com/docs/get-started/run-your-dbt-projects) . Go to the project directory just created and execute the default dbt model:

```shell
dbt run 
```

You can see that two models are running: my_first_dbt_model and my_second_dbt_model

They are materialized table table and view view respectively.

You can log in to selectdb to view the data results and table creation statements of my_first_dbt_model and my_second_dbt_model.

### Materialization types of dbt-selectdb adapter

The Materialization method of dbt-selectdb supports three types

1. view
2. table
3. incremental

#### View

Using view as the materialization mode, Models will be rebuilt into views through the create view as statement every time they run. (By default, the materialization method of dbt is view)

```text
Pros: 
No extra data is stored, and views on top of the source data will always contain the latest records.

Cons: 
View queries that perform large transformations or are nested on top of other views are slow.

Recommendation:
Usually start with the view of the model and only change to another materialization if you notice performance issues. Views are best suited for models that do not undergo major transformations, such as renaming, column changes.
```

Configuration items:

```yaml
models:
  <resource-path>:
    +materialized: view
```

Or config in the model file

```jinja
{{ config(materialized = "view") }}
```

#### Table

When using table materialization, your model is rebuilt as a table each time it is run through the create table as statement.

```text
Pros:
table query speed will be faster than view.

Cons: 
The table takes a long time to build or rebuild, additional data will be stored, and incremental data synchronization cannot be performed.

Recommendation: 
It is recommended to use the table materialization method for models queried by BI tools or models with slow operations such as downstream queries and conversions.
```

Configuration items:

```yaml
models:
  <resource-path>:
    +materialized: table
    +duplicate_key: [ <column-name>, ... ],
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int,
    +properties: {<key>:<value>,...}
```

Or config in the model file

```jinja
{{ config(
    materialized = "table",
    duplicate_key = [ "<column-name>", ... ],
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "int",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```



The details of the above configuration items are as follows:

| configuration item  | describe                                                     | Required? |
| ------------------- | ------------------------------------------------------------ | --------- |
| `materialized`      | The materialized form of the table (corresponding to creating a table model as a detailed model (Duplicate)) | Required  |
| `duplicate_key`     | Sort Columns for Detail Models                               | Optional  |
| `partition_by`      | table partition column                                       | Optional  |
| `partition_type`    | Table partition type, range or list.(default: `RANGE`)       | Optional  |
| `partition_by_init` | Initialized table partitions                                 | Optional  |
| `distributed_by`    | table bucket column                                          | Optional  |
| `buckets`           | Number of buckets                                            | Optional  |
| `properties`        | Other configurations for creating tables                     | Optional  |

#### Incremental

Based on the incremental model result of the last run of dbt, records are incrementally inserted or updated into the table.

- Note: The incremental implementation of selectdb depends on the unique model. If there is an incremental requirement, specify the materialization as incremental when initializing the data of the model

```text
Pros: 
Significantly reduces build time by only converting new records.

Cons: 
incremental mode requires additional configuration, which is an advanced usage of dbt, and requires the support of complex scenarios and the adaptation of corresponding components.

Recommendation: 
The incremental model is best for event-based scenarios or when dbt runs become too slow
```

Configuration items:

```yaml
models:
  <resource-path>:
    +materialized: incremental
    +unique_key: [ <column-name>, ... ],
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int,
    +properties: {<key>:<value>,...}
```

Or config in the model file

```jinja
{{ config(
    materialized = "incremental",
    unique_key = [ "<column-name>", ... ],
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "int",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```

The details of the above configuration items are as follows:

| configuration item  | describe                                                     | Required? |
| ------------------- | ------------------------------------------------------------ | --------- |
| `materialized`      | The materialized form of the table (corresponding to creating a table model as a detailed model (unique)) | Required  |
| `unique_key`        | The key column of the unique table                           | Required  |
| `partition_by`      | table partition column                                       | Optional  |
| `partition_type`    | Table partition type, range or list.(default: `RANGE`)       | Optional  |
| `partition_by_init` | Initialized table partitions                                 | Optional  |
| `distributed_by`    | table bucket column                                          | Optional  |
| `buckets`           | Number of buckets                                            | Optional  |
| `properties`        | Other configurations for creating tables                     | Optional  |