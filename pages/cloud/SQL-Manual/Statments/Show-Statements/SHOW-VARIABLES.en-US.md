---
{
    "title": "SHOW-VARIABLES",
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

## SHOW-VARIABLES

### Name

SHOW VARIABLES

### Description

This statement is used to display Doris system variables, which can be queried by conditions

Syntax:

````sql
SHOW [GLOBAL | SESSION] VARIABLES
     [LIKE 'pattern' | WHERE expr]
````

Note:

- show variables is mainly used to view the values of system variables.
- Executing the SHOW VARIABLES command does not require any privileges. Anyone who has connected to the server can execute this command.
- The like statement means to match by variable_name
- The % wildcard can be used anywhere in the matching pattern

### Example

1. Match by variable_name. The following example shows an exact matching

    ```sql
    show variables like 'max_connections';
    ````

2. Use the % wildcard to match multiple items

    ```sql
    show variables like '%connec%';
    ````

3. Use the Where clause for matching queries

    ```sql
    show variables where variable_name = 'version';
    ````

### Keywords

    SHOW, VARIABLES

### Best Practice

