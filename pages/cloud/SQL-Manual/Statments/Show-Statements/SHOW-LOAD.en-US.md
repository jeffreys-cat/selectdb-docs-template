---
{
    "title": "SHOW-LOAD",
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

## SHOW-LOAD

### Name

SHOW LOAD

### Description

This statement is used to display the execution of the specified import task

Syntax:

```sql
SHOW LOAD
[FROM db_name]
[
   WHERE
   [LABEL [ = "your_label" | LIKE "label_matcher"]]
   [STATE = ["PENDING"|"ETL"|"LOADING"|"FINISHED"|"CANCELLED"|]]
]
[ORDER BY...]
[LIMIT limit][OFFSET offset];
````

Note:

1. If db_name is not specified, the current db is used by default.

2. If LABEL LIKE is used, it will match import tasks whose label contains label_matcher.

3. If LABEL = is specified, it will match the specified label exactly.

4. If STATE is specified, it will match the LOAD state.

5. You can use ORDER BY to reorder any combination of columns

6. If LIMIT is specified, limit matching records are displayed; otherwise show all.

7. If OFFSET is specified, the query results starting from offset are displayed. The default offset is 0.

8. If you are using broker/mini load, the connections in the URL column can be viewed using the following command:

   ```sql
   SHOW LOAD WARNINGS ON 'url'
   ````

### Example

1. Show all import tasks for the default db

   ```sql
   SHOW LOAD;
   ````

2. Display the earliest 10 import tasks of the specified db, of which the label contains the string "2014_01_02"

   ```sql
   SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
   ````

3. Display the import tasks of the specified db, specify the label as "load_example_db_20140102" and sort by LoadStartTime in descending order

   ```sql
   SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
   ````

4. Display the import task of the specified db, specify the label as "load_example_db_20140102", the state as "loading", and sort by LoadStartTime in descending order

   ```sql
   SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
   ````

5. Display the import tasks of the specified db and sort them in descending order by LoadStartTime, and display 10 query results starting from offset 5

   ```sql
   SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
   SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
   ````

6. Small batch import is a command to check the import status

   ````
   curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
   ````

### Keywords

    SHOW, LOAD

### Best Practice

