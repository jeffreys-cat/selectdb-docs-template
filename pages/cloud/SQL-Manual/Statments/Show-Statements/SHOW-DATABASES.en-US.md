---
{
    "title": "SHOW-DATABASES",
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

## SHOW-DATABASES

### Name

SHOW DATABASES

### Description

This statement is used to display the currently visible db

Syntax:

```sql
SHOW DATABASES [FROM catalog] [filter expr];
````

Note:
1. `SHOW DATABASES` will display all database names
2. `SHOW DATABASES FROM catalog` will display all database names from the current catalog.
3. `SHOW DATABASES filter_expr` will display filtered database names from the current catalog.
4. `SHOW DATABASES FROM catalog filter_expr` is not support yet.

### Example
1. Display all the database names

   ```sql
   SHOW DATABASES;
   ````

   ````
    +--------------------+
    | Database           |
    +--------------------+
    | test               |
    | information_schema |
    +--------------------+
   ````

2. Display all database names from the catalog named 'hms_catalog'.

   ```sql
   SHOW DATABASES from hms_catalog;
   ````

   ````
    +---------------+
    | Database      |
    +---------------+
    | default       |
    | tpch          |
    +---------------+
   ````

3. Display the filtered database names from the current catalog using the expression `like 'infor%'`.

   ```sql
   SHOW DATABASES like 'infor%';
   ````

   ````
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    +--------------------+
   ````

### Keywords

    SHOW, DATABASES

### Best Practice

