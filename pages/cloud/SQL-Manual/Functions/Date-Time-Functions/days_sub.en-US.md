---
{
    "title": "days_sub",
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

## days_sub
### Description
**Syntax:**

`DATETIME DAYS_SUB(DATETIME date, INT days)`

This function subtracts the specified days from the DATE or DATETIME.

`data` can be of DATE or DATETIME type and the returned result is of the same type of `date`.

### Example

```
mysql> select days_sub("2020-02-02 02:02:02", 1);
+------------------------------------+
| days_sub('2020-02-02 02:02:02', 1) |
+------------------------------------+
| 2020-02-01 02:02:02                |
+------------------------------------+
```

### Keywords

    DAYS_SUB
