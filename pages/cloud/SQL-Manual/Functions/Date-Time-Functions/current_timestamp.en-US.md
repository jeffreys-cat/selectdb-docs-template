---
{
    "title": "current_timestamp",
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

## current_timestamp
### Description
**Syntax:**

`DATETIME CURRENT_TIMESTAMP()`


This function fetches the current time and returns it in the DATETIME type.

### Example

```
mysql> select current_timestamp();
+---------------------+
| current_timestamp() |
+---------------------+
| 2019-05-27 15:59:33 |
+---------------------+
```

`DATETIMEV2 NOW(INT precision)`


It fetches the current time and returns it in the DatetimeV2 type. `precision` represents the precision that the user wants. Currently, Doris supports microsecond-level precision, which means the value range of precision is [0, 6].

### Example

```
mysql> select current_timestamp(3);
+-------------------------+
| current_timestamp(3)    |
+-------------------------+
| 2022-09-06 16:18:00.922 |
+-------------------------+
```

**Note:**
1. Currently, only the DatetimeV2 type supports second-level precision.
2. Limited by the JDK implementation, if you use JDK8 to build FE, Doris only supports millisecond-level precision (three decimal places). Further precision bits will be filled with 0. If you need higher precision, please use JDK11.

### Keywords
    CURRENT_TIMESTAMP,CURRENT,TIMESTAMP
