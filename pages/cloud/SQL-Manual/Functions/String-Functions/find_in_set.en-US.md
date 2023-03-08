---
{
    "title": "find_in_set",
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

## find_in_set
### Description
**Syntax:**

`INT find_in_set(VARCHAR str, VARCHAR strlist)`


This function returns the location where `str` first appears in `strlist` (counting from 1). `strlist` is a comma-separated string. If `str` is not found in `strlist`, it will return 0. If any argument is NULL, it will return NULL.

### Example

```
mysql> select find_in_set("b", "a,b,c");
+---------------------------+
| find_in_set('b', 'a,b,c') |
+---------------------------+
|                         2 |
+---------------------------+
```
### Keywords
    FIND_IN_SET,FIND,IN,SET
