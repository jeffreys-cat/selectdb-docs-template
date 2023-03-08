---
{
    "title": "arrays_overlap",
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


## arrays_overlap

### Description

#### **Syntax:**

`BOOLEAN arrays_overlap(ARRAY<T> left, ARRAY<T> right)`

This function checks if there are any common elements in the left and right arrays. It returns one of the following results:

```
1    - there are common elements;
0    - there are no common elements;
NULL - the left or right array is NULL; or the left or right array contains NULL values;
```

**Note:**

It is only supported in vectorized engine.

### Example

```
mysql> set enable_vectorized_engine=true;

mysql> select c_left,c_right,arrays_overlap(c_left,c_right) from array_test;
+--------------+-----------+-------------------------------------+
| c_left       | c_right   | arrays_overlap(`c_left`, `c_right`) |
+--------------+-----------+-------------------------------------+
| [1, 2, 3]    | [3, 4, 5] |                                   1 |
| [1, 2, 3]    | [5, 6]    |                                   0 |
| [1, 2, NULL] | [1]       |                                NULL |
| NULL         | [1, 2]    |                                NULL |
| [1, 2, 3]    | [1, 2]    |                                   1 |
+--------------+-----------+-------------------------------------+
```

### Keywords

```
ARRAY,ARRAYS,OVERLAP,ARRAYS_OVERLAP
```

