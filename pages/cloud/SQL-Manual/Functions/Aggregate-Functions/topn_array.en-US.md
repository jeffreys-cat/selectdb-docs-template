---
{
    "title": "TOPN_ARRAY",
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

## TOPN_ARRAY
### Description
**Syntax:**

`ARRAY<T> topn_array(expr, INT top_num[, INT space_expand_rate])`

This function uses the Space-Saving algorithm to calculate the top_num most frequent items in expr. It returns the 
frequent items and their occurrence times, which is an approximation.

The space_expand_rate parameter is optional. It determines the number of counters used in the Space-Saving algorithm.

```
counter numbers = top_num * space_expand_rate
```
The larger the space_expand_rate is, the more accurate the result will be. The default value is 50.

### Example
```
mysql> select topn_array(k3,3) from baseall;
+--------------------------+
| topn_array(`k3`, 3)      |
+--------------------------+
| [3021, 2147483647, 5014] |
+--------------------------+
1 row in set (0.02 sec)

mysql> select topn_array(k3,3,100) from baseall;
+--------------------------+
| topn_array(`k3`, 3, 100) |
+--------------------------+
| [3021, 2147483647, 5014] |
+--------------------------+
1 row in set (0.02 sec)
```
### Keywords
```
TOPN, TOPN_ARRAY
```

