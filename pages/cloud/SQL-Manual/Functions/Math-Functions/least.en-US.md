---
{
    "title": "least",
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

## least

### Description
**Syntax:**

`least(col_a, col_b, …, col_n)`  

`column` supports the following types: `TINYINT` `SMALLINT` `INT` `BIGINT` `LARGEINT` `FLOAT` `DOUBLE` `STRING` `DATETIME` `DECIMAL`

This function compares the size of `n column`s and returns the smallest one among them. If there is `NULL` in `column`, it returns `NULL`.

### Example

```
mysql> select least(-1, 0, 5, 8);
+--------------------+
| least(-1, 0, 5, 8) |
+--------------------+
|                 -1 |
+--------------------+
mysql> select least(-1, 0, 5, NULL);
+-----------------------+
| least(-1, 0, 5, NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
mysql> select least(6.3, 4.29, 7.6876);
+--------------------------+
| least(6.3, 4.29, 7.6876) |
+--------------------------+
|                     4.29 |
+--------------------------+
mysql> select least("2022-02-26 20:02:11","2020-01-23 20:02:11","2020-06-22 20:02:11");
+----------------------------------------------------------------------------+
| least('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
+----------------------------------------------------------------------------+
| 2020-01-23 20:02:11                                                        |
+----------------------------------------------------------------------------+
```

### Keywords
	LEAST
