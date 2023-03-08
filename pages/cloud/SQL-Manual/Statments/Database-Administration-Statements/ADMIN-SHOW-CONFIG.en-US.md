---
{
    "title": "ADMIN-SHOW-CONFIG",
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

## ADMIN-SHOW-CONFIG

### Name

ADMIN SHOW CONFIG

### Description

This statement is used to display the configuration of the current cluster (currently only the configuration items of FE clusters are supported)

Syntax:

```sql
 ADMIN SHOW FRONTEND CONFIG [LIKE "pattern"];
````

Implications of the columns in the results are as follows:

1. Key: configuration item name
2. Value: configuration item value
3. Type: configuration item type
4. IsMutable: if it can be set by ADMIN SET CONFIG command
5. MasterOnly: if it is only applicable to Master FE
6. Comment: configuration item description

### Example

 1. View the configuration of the current FE node

       ```sql
       ADMIN SHOW FRONTEND CONFIG;
       ```

2. Use the like predicate to search the configuration of the current FE node

   ````
   mysql> ADMIN SHOW FRONTEND CONFIG LIKE '%check_java_version%';
   +--------------------+-------+---------+---------- -+------------+---------+
   | Key | Value | Type | IsMutable | MasterOnly | Comment |
   +--------------------+-------+---------+---------- -+------------+---------+
   | check_java_version | true | boolean | false | false | |
   +--------------------+-------+---------+---------- -+------------+---------+
   1 row in set (0.01 sec)
   ````

### Keywords

    ADMIN, SHOW, CONFIG, ADMIN SHOW

### Best Practice

