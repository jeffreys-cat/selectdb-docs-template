---
{
    "title": "RECOVER",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## RECOVER

### Name

RECOVER

### Description

This statement is used to restore a previously deleted database, table or partition.

You can get all meta informations that can be recovered by statement `SHOW CATALOG RECYCLE BIN`.

Syntax:

1. restore database

   ```sql
   RECOVER DATABASE db_name;
   ```

2. restore table

   ```sql
   RECOVER TABLE [db_name.]table_name;
   ```

 3. restore partition

    ```sql
    RECOVER PARTITION partition_name FROM [db_name.]table_name;
    ```

Note:

- This operation can only restore meta information that was deleted in the previous period (1 day by default). (Configurable through the `catalog_trash_expire_second` parameter in fe.conf)
- If you have delete a meta data and create a new one with the same name and same type, then the previously deleted meta data cannot be recovered.  

### Example

1. Restore the database named example_db

```sql
RECOVER DATABASE example_db;
```

2. Restore the table named example_tbl

```sql
RECOVER TABLE example_db.example_tbl;
```

3. Restore the partition named p1 in table example_tbl

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

### Keywords

     RECOVER

### Best Practice

