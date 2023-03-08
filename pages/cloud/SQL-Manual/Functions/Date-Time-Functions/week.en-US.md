---
{
    "title": "week",
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

## week
### Description
**Syntax:**

`INT WEEK(DATE date)`
`INT WEEK(DATE date, INT mode)`

This function returns the week number of the given date.The default value of `mode` is 0. The following table describes how the mode argument works.
| Mode | First day of week | Range | Definition of the first week                                 |
| :--- | :---------------- | :---- | :----------------------------------------------------------- |
| 0    | Sunday            | 0-53  | The week containing  the first Sunday of the year            |
| 1    | Monday            | 0-53  | The first week in the year that no less than 4 days of the week belongs to the year |
| 2    | Sunday            | 1-53  | The week containing  the first Sunday of the year            |
| 3    | Monday            | 1-53  | The first week in the year that no less than 4 days of the week belongs to the year |
| 4    | Sunday            | 0-53  | The first week in the year that no less than 4 days of the week belongs to the year |
| 5    | Monday            | 0-53  | The week containing  the first Monday of the year            |
| 6    | Sunday            | 1-53  | The first week in the year that no less than 4 days of the week belongs to the year |
| 7    | Monday            | 1-53  | The week containing  the first Monday of the year            |

The parameter is of DATE or DATETIME type.

### Example
```
mysql> select week('2020-1-1');
+------------------+
| week('2020-1-1') |
+------------------+
|                0 |
+------------------+
```
```
mysql> select week('2020-7-1',1);
+---------------------+
| week('2020-7-1', 1) |
+---------------------+
|                  27 |
+---------------------+
```
### Keywords
    WEEK
