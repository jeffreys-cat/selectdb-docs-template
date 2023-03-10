---
{
    "title": "not_null_or_empty",
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

## not_null_or_empty
### description
**Syntax:**

`BOOLEAN NOT_NULL_OR_EMPTY (VARCHAR str)`

If `str` is an empty or null string, this function will return false; otherwise, it will return true.

### Example

```
MySQL [(none)]> select not_null_or_empty(null);
+-------------------------+
| not_null_or_empty(NULL) |
+-------------------------+
|                       0 |
+-------------------------+

MySQL [(none)]> select not_null_or_empty("");
+-----------------------+
| not_null_or_empty('') |
+-----------------------+
|                     0 |
+-----------------------+

MySQL [(none)]> select not_null_or_empty("a");
+------------------------+
| not_null_or_empty('a') |
+------------------------+
|                      1 |
+------------------------+
```
### Keywords
    NOT_NULL_OR_EMPTY
