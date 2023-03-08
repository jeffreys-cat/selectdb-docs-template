---
{
    "title": "PERCENTILE_APPROX",
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

## PERCENTILE_APPROX
### Description
**Syntax:**

`PERCENTILE_APPROX(expr, DOUBLE p[, DOUBLE compression])`

This function returns the approximation of th p percentile. The value of P is between 0 and 1.

The compression parameter is optional. Its range is [2048, 10000]. Larger compression values brings more precise results, but also, more time and memory costs. If the compression parameter is not specified or set beyond [2048, 10000], the system will consider it to be 10000.

This function uses fixed-size memory, so it can reduce memory usage of high-cardinality columns. It can be used to calculate statistics such as tp99.

### Example
```
MySQL > select `table`, percentile_approx(cost_time,0.99) from log_statis group by `table`;
+---------------------+---------------------------+
| table    | percentile_approx(`cost_time`, 0.99) |
+----------+--------------------------------------+
| test     |                                54.22 |
+----------+--------------------------------------+

MySQL > select `table`, percentile_approx(cost_time,0.99, 4096) from log_statis group by `table`;
+---------------------+---------------------------+
| table    | percentile_approx(`cost_time`, 0.99, 4096.0) |
+----------+--------------------------------------+
| test     |                                54.21 |
+----------+--------------------------------------+
```
### Keywords
```
PERCENTILE_APPROX,PERCENTILE,APPROX
```

