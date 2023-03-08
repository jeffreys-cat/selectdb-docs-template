---
{
    "title": "weekday",
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

## weekday
### Description
**Syntax:**

`INT WEEKDAY (DATETIME date)`


This function returns the index value of the weekday of the date (Monday = 0, Tuesday = 2, and Sunday = 6).

The parameter can be of DATE or DATETIME type. It can also be any number that can be casted into a DATE or DATETIME type.

Please note the difference between WEEKDAY and DAYOFWEEK:
```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```

### Example
```
mysql> select weekday('2019-06-25');
+--------------------------------+
| weekday('2019-06-25 00:00:00') |
+--------------------------------+
|                              1 |
+--------------------------------+

mysql> select weekday(cast(20190625 as date)); 
+---------------------------------+
| weekday(CAST(20190625 AS DATE)) |
+---------------------------------+
|                               1 |
+---------------------------------+
```
### Keywords
    WEEKDAY
