---
{
    "title": "lpad",
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

## lpad
### Description
**Syntax:**

`VARCHAR lpad (VARCHAR str, INT len, VARCHAR pad)`


This function returns a string of length `len` in `str`, starting from the first letter of the string. If `len` is longer than `str`, it will put the characters of `pad`  to the start of  `str` until the specified length is reached. If `len` is shorter than `str`, it will truncate the `str` string and return a string of the specified length. `len` is about character length but not bye size.

### Example

```
mysql> SELECT lpad("hi", 5, "xy");
+---------------------+
| lpad('hi', 5, 'xy') |
+---------------------+
| xyxhi               |
+---------------------+

mysql> SELECT lpad("hi", 1, "xy");
+---------------------+
| lpad('hi', 1, 'xy') |
+---------------------+
| h                   |
+---------------------+
```
### Keywords
    LPAD
