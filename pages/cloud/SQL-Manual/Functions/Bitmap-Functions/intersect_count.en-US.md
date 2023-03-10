---
{
"title": "intersect_count",
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

## intersect_count
### Description
**Syntax:**

`BITMAP INTERSECT_COUNT(bitmap_column, column_to_filter, filter_values)`

This is an aggregation function that calculates the intersection of bitmaps. It does not require data distribution orthogonality. The first argument is the bitmap column, the second is the dimension column used for filtering, and the third is a variable-length argument, which specifies filter values.

### Example

```
MySQL [test_query_qa]> select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
+------+-----------------------------+
| dt   | bitmap_to_string(`user_id`) |
+------+-----------------------------+
|    4 | 1,2,3                       |
|    3 | 1,2,3,4,5                   |
+------+-----------------------------+
2 rows in set (0.012 sec)

MySQL [test_query_qa]> select intersect_count(user_id,dt,3,4) from pv_bitmap;
+----------------------------------------+
| intersect_count(`user_id`, `dt`, 3, 4) |
+----------------------------------------+
|                                      3 |
+----------------------------------------+
1 row in set (0.014 sec)
```

### Keywords

    INTERSECT_COUNT,BITMAP
