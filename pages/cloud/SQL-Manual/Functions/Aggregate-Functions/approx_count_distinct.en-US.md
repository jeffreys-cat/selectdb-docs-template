---
{
    "title": "APPROX_COUNT_DISTINCT",
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

## APPROX_COUNT_DISTINCT
### Description
**Syntax:**

`APPROX_COUNT_DISTINCT (expr)`


This function returns an approximate aggregation function similar to the result of COUNT (DISTINCT col).

It is faster than the combination of COUNT and DISTINCT and uses fixed-size memory, so it can reduce memory usage for high-cardinality columns.

### Example
```
MySQL > select approx_count_distinct(query_id) from log_statis group by datetime;
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```
### Keywords

```
APPROX_COUNT_DISTINCT
```

