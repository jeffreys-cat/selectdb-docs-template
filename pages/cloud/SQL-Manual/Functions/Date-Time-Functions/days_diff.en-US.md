---
{
    "title": "days_diff",
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

## days_diff
### Description
**Syntax:**

`INT days_diff(DATETIME enddate, DATETIME startdate)`

This function calculate the number of days between the startdate to the enddate.

### Example

```
mysql> select days_diff('2020-12-25 22:00:00','2020-12-24 22:00:00');
+---------------------------------------------------------+
| days_diff('2020-12-25 22:00:00', '2020-12-24 22:00:00') |
+---------------------------------------------------------+
|                                                       1 |
+---------------------------------------------------------+
```

### Keywords

    days_diff
