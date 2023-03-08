---
{
    "title": "BITMAP",
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

## BITMAP
### Description
```
BITMAP
```

BITMAP cannot be used as a key column. The aggregation type when creating a table is BITMAP_UNION.

The user does not need to specify the length and default value. The system will determine the length according to the data aggregation degree.

The BITMAP column can only be queried or used by its supporting functions such as `bitmap_union_count`, `bitmap_union`, `bitmap_hash`, and `bitmap_hash64`.
    
The use of BITMAP in offline scenarios will slow down the import. When handling large data volume, the query speed will be slower than HLL and faster than Count Distinct.

Note: In real-time scenarios, if BITMAP does not use a global dictionary, using `bitmap_hash()` may cause an error rate of about 1/1000. You may use `bitmap_hash64` for lower error rate.

### Example

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;

### Keywords
```
BITMAP
```

