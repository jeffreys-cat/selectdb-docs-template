# SQL Blacklist

It is used to limit the query statement, and does not limit the execution of the explain statement. Support to configure SQL blacklist by user:

1. Reject the specified SQL by means of regular matching
2. Check if a query hits one of these limits by setting partition_num, tablet_num, cardinality

	- partition_num, tablet_num, cardinality can be set together, once a query reaches one of the limits, the query will be blocked

## Add、delete、modify and query SQL rules

- Create SQL block rules, for more creation syntax, please refer to 

  CREATE SQL BLOCK RULE

  - sql: matching rules (based on regular matching, special characters need to be translated), optional, the default value is "NULL"
  - sqlHash: sql hash value, used for exact match, we will `fe.audit.log`print this value, optional, this parameter and sql can only choose one, the default value is "NULL"
  - partition_num: The maximum number of partitions that a scanning node will scan, the default value is 0L
  - tablet_num: The maximum number of tablets that a scanning node will scan, the default value is 0L
  - cardinality: the rough scan line number of a scan node, the default value is 0L
  - global: Whether to take effect globally (all users), the default is false
  - enable: whether to enable blocking rules, the default is true

```sql
CREATE SQL_BLOCK_RULE test_rule 
PROPERTIES(
  "sql"="select \\* from order_analysis",
  "global"="false",
  "enable"="true",
  "sqlHash"=""
)
```

> Notice:
>
> Here, the sql statement should not have a semicolon at the end

When we execute the sql we defined in the rules just now, an abnormal error will be returned. The example is as follows:

```sql
mysql> select * from order_analysis;
ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
```

- Create test_rule2, limit the maximum number of scanned partitions to 30, and the maximum scan base to 10 billion rows. The example is as follows:

```sql
CREATE SQL_BLOCK_RULE test_rule2 PROPERTIES("partition_num" = "30", "cardinality"="10000000000","global"="false","enable"="true")
```

- View the configured SQL blocking rules. If you do not specify a rule name, you will view all the rules. For specific syntax, please refer to [SHOW SQL BLOCK RULE](https://cn-selectdb-com.translate.goog/cloud-docs/使用指南/sql-manual/sql-reference/Show-Statements/SHOW-SQL-BLOCK-RULE.md?_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp)

```sql
SHOW SQL_BLOCK_RULE [FOR RULE_NAME]
```

- Modify the SQL blocking rules to allow modification of each item such as sql/sqlHash/partition_num/tablet_num/cardinality/global/enable. For specific syntax, please refer to 

  ALTER SQL BLOCK RULE

  - sql and sqlHash cannot be set at the same time. This means that if a rule sets sql or sqlHash, the other property will not be modifiable
  - sql/sqlHash and partition_num/tablet_num/cardinality cannot be set at the same time. For example, if a rule sets partition_num, then sql or sqlHash cannot be modified

```sql
ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
```

```text
ALTER SQL_BLOCK_RULE test_rule2 PROPERTIES("partition_num" = "10","tablet_num"="300","enable"="true")
```

- Delete SQL blocking rules, support multiple rules to `,`separate, please refer to [DROP SQL BLOCK RULR for specific syntax](https://cn-selectdb-com.translate.goog/cloud-docs/使用指南/sql-manual/sql-reference/Data-Definition-Statements/Drop/DROP-SQL-BLOCK-RULE.md?_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp)

```text
DROP SQL_BLOCK_RULE test_rule1,test_rule2
```

## User rule binding

If you configure global=false, you need to configure the rule binding for the specified user, and multiple rules are `,`separated

```sql
SET PROPERTY [FOR 'jack'] 'sql_block_rules' = 'test_rule1,test_rule2'
```
