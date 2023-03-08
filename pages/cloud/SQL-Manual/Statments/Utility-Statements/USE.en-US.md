---
{
    "title": "USE",
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

## USE

### Name

USE

### Description

This statement is used to access a database

Syntax:

````SQL
USE <[CATALOG_NAME].DATABASE_NAME>
````

Note:
1. The `USE CATALOG_NAME.DATABASE_NAME` will switch the current catalog to `CATALOG_NAME` , and then the current database to `DATABASE_NAME`

### Example

1. Access the demo database, which exists in the current catalog:

    ```sql
    mysql> use demo;
    Database changed
    ````
2. Access the demo database, which exists in `hms_catalog`:

    ```sql
    mysql> use hms_catalog.demo;
    Database changed
    ````

### Keywords

    USE

### Best Practice

