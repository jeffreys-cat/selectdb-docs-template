---
{
    "title": "numbers",
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

## numbers

### Description

This is a table function that generates a temporary table with only one column named `number` and a row value of [0,n).

It is used in FROM clauses.

**Syntax:**
```
numbers(
  "number" = "n",
  "backend_num" = "m"
  );
```

Parameters：
- `n`: It means to generate [0, n) rows.
- `m`: Optional. It means this function is executed simultaneously on `m` BE nodes (multiple BE nodes need to be deployed).

### Example
```
mysql> select * from numbers("number" = "10");
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
|      5 |
|      6 |
|      7 |
|      8 |
|      9 |
+--------+
```

### Keywords

    numbers