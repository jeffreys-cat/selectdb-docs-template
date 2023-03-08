---
{
    "title": "countequal",
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

## countequal

### Description

**Syntax:**

`BIGINT countequal(ARRAY<T> arr, T value)`

This function returns the number of values in the array. It returns one of the following results:

```
num      - the number of values in the array;
0        - there are no values in the array;
NULL     - the array is NULL or the value is NULL.
```

**Note:**

It is only supported in vectorized engine.

### Example

```
mysql> set enable_vectorized_engine=true;

mysql> select *, countEqual(c_array,5) from array_test;
+------+-----------------+--------------------------+
| id   | c_array         | countequal(`c_array`, 5) |
+------+-----------------+--------------------------+
|    1 | [1, 2, 3, 4, 5] |                        1 |
|    2 | [6, 7, 8]       |                        0 |
|    3 | []              |                        0 |
|    4 | NULL            |                     NULL |
+------+-----------------+--------------------------+
```

### Keywords

```
ARRAY,COUNTEQUAL
```



