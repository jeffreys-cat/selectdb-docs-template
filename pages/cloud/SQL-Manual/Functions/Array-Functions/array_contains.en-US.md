---
{
    "title": "array_contains",
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

## array_contains

### Description

**Syntax:**

`BOOLEAN array_contains(ARRAY<T> arr, T value)`

This function checks if a value exists in an array. It returns the following values:

```
1    - the value exists in the array;
0    - the value does not exist in the array;
NULL - the array is NULL;
```

**Note:**

It is only supported in vectorized engine.

### Example

```
mysql> set enable_vectorized_engine=true;

mysql> SELECT id,c_array,array_contains(c_array, 5) FROM `array_test`;
+------+-----------------+------------------------------+
| id   | c_array         | array_contains(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            1 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+

mysql> select array_contains([null, 1], null);
+--------------------------------------+
| array_contains(ARRAY(NULL, 1), NULL) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+
1 row in set (0.00 sec)
```

### Keywords

```
ARRAY,CONTAIN,CONTAINS,ARRAY_CONTAINS
```



