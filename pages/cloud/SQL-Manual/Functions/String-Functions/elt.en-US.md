---
{
    "title": "elt",
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

## elt
### Description
**Syntax:**

`VARCHAR elt (INT,VARCHAR,...)`

This function returns the string at the specified index. If there is no string at the specified index, it will return NULL.

### Example

```
mysql> select elt(1, 'aaa', 'bbb');
+----------------------+
| elt(1, 'aaa', 'bbb') |
+----------------------+
| aaa                  |
+----------------------+
mysql> select elt(2, 'aaa', 'bbb');
+-----------------------+
| elt(2, 'aaa', 'bbb')  |
+-----------------------+
| bbb                   |
+-----------------------+
mysql> select elt(0, 'aaa', 'bbb');
+----------------------+
| elt(0, 'aaa', 'bbb') |
+----------------------+
| NULL                 |
+----------------------+
mysql> select elt(2, 'aaa', 'bbb');
+-----------------------+
| elt(3, 'aaa', 'bbb')  |
+-----------------------+
| NULL                  |
+-----------------------+
```
### Keywords
    ELT
