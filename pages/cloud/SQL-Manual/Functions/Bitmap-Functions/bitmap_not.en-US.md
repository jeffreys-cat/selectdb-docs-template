---
{
    "title": "bitmap_not",
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

## bitmap_not
### Description
**Syntax:**

`BITMAP BITMAP_NOT(BITMAP lhs, BITMAP rhs)`

This function calculates the set after lhs minus rhs and returns the new bitmap.

### Example

```
mysql> select bitmap_count(bitmap_not(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4'))) cnt;
+------+
| cnt  |
+------+
|    0 |
+------+

mysql> select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'),bitmap_from_string('1,2,3,4')));
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 5                                                                                      |
+----------------------------------------------------------------------------------------+
```

### Keywords

    BITMAP_NOT,BITMAP
