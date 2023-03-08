---
{
    "title": "HLL (HyperLogLog)",
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

## HLL (HyperLogLog)
### Description
```
HLL
```

HLL cannot be used as a key column. The aggregation type when creating a table is HLL_UNION.

The user does not need to specify the length and default value. The system will determine the length according to the data aggregation degree.

The HLL column can only be queried or used by its supporting functions such as `hll_union_agg`, `hll_raw_agg`, `hll_cardinality`, and `hll_hash`.


HLL uses fuzzy deduplication. When handling large data volumes, its performance is better than Count Distinct. 

The error rate of HLL is usually around 1% and sometimes 2%.

### Example

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;

### Keywords
```
HLL,HYPERLOGLOG
```

