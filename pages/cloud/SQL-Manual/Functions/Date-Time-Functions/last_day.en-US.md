---
{
    "title": "last_day",
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

## last_day
### Description
**Syntax:**

`DATE last_day(DATETIME date)`

This function returns the last day of the month of the given date. In the returned result, the year and month will be the same as the input while the day can be one of the followings:

'28' (February of a non-leap year), 
'29' (February of a leap year),
'30' (April, June, September, November),
'31 '(January, March, May, July, August, October, December)

### Example

```
mysql > select last_day('2000-02-03');
+-------------------+
| last_day('2000-02-03 00:00:00') |
+-------------------+
| 2000-02-29        |
+-------------------+
```

### Keywords
    LAST_DAY,DAYS
