---
{
    "title": "truncate",
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

## truncate

### Description
**Syntax:**

`DOUBLE truncate(DOUBLE x, INT d)`

This function truncates `x` according to the number of decimal places `d`.

The rules are as follows: 
If `d > 0`: keep `d` decimal places of `x`. 
If  `d = 0`: retain the integer part of `x` only. 
If `d < 0`: retain the integer part of `x` only, and replace `d` digit places in the integer part with `o` .

### Example

```
mysql> select truncate(124.3867, 2);
+-----------------------+
| truncate(124.3867, 2) |
+-----------------------+
|                124.38 |
+-----------------------+
mysql> select truncate(124.3867, 0);
+-----------------------+
| truncate(124.3867, 0) |
+-----------------------+
|                   124 |
+-----------------------+
mysql> select truncate(-124.3867, -2);
+-------------------------+
| truncate(-124.3867, -2) |
+-------------------------+
|                    -100 |
+-------------------------+
```

### Keywords
	TRUNCATE
