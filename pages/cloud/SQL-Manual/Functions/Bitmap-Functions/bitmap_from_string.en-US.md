---
{
    "title": "bitmap_from_string",
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

## bitmap_from_string

### Description
**Syntax:**

`BITMAP BITMAP_FROM_STRING(VARCHAR input)`

This function converts a string into a bitmap. The input string should be a group of unsigned bigint numbers separated by ",". (The numbers range from 0 to 18446744073709551615.)
For example, the input string "0, 1, 2" will be converted to a bitmap with bit 0, 1, 2 being set. If input string is invalid, it will return NULL.

### Example

```
mysql> select bitmap_to_string(bitmap_empty());
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+

mysql> select bitmap_to_string(bitmap_from_string("0, 1, 2"));
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_string('0, 1, 2')) |
+-------------------------------------------------+
| 0,1,2                                           |
+-------------------------------------------------+

mysql> select bitmap_from_string("-1, 0, 1, 2");
+-----------------------------------+
| bitmap_from_string('-1, 0, 1, 2') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

mysql> select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615"));
+--------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_string('0, 1, 18446744073709551615')) |
+--------------------------------------------------------------------+
| 0,1,18446744073709551615                                           |
+--------------------------------------------------------------------+
```

### Keywords

    BITMAP_FROM_STRING,BITMAP
