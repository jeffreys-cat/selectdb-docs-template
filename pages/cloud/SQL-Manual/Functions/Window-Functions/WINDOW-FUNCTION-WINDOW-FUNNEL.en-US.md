---
{
    "title": "WINDOW-FUNCTION-WINDOW-FUNNEL",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## WINDOW FUNCTION WINDOW_FUNNEL
### Description

This function searches the sequence length of the longest event in the sliding window.

- `window` : the size of the sliding window (measured in seconds)
- `mode` : reserved, currently only supports the default value
- `timestamp_column`: specifies the time column (type: DATETIME). The sliding window works on this column.
- `evnetN`: a boolean expression that represents the event

The function works according to the following algorithm:

- It searches for the first event that meets the specified condition and set the length of the event to 1. This is the moment when the sliding window starts timing.
- If the events occur in the specified order within the window, the time counter will be incremented. If they don't, the time counter will not be incremented.
- If multiple event chains have been found, the function will only return the length of the longest chain.

```sql
window_funnel(window, mode, timestamp_column, event1, event2, ... , eventN)
```

### Example

```sql
CREATE TABLE windowfunnel_test (
                `xwho` varchar(50) NULL COMMENT 'xwho',
                `xwhen` datetime COMMENT 'xwhen',
                `xwhat` int NULL COMMENT 'xwhat'
                )
DUPLICATE KEY(xwho)
DISTRIBUTED BY HASH(xwho) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT into windowfunnel_test (xwho, xwhen, xwhat) values ('1', '2022-03-12 10:41:00', 1),
                                                   ('1', '2022-03-12 13:28:02', 2),
                                                   ('1', '2022-03-12 16:15:01', 3),
                                                   ('1', '2022-03-12 19:05:04', 4);

select window_funnel(3600 * 3, 'default', t.xwhen, t.xwhat = 1, t.xwhat = 2 ) AS level from windowfunnel_test t;

| level |
|---|
| 2 |
```

### Keywords

    WINDOW,FUNCTION,WINDOW_FUNNEL
