---
{
    "title": "QUANTILE_STATE",
    "language": "zh-CN"
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

## QUANTILE_STATE
### Description

```
QUANTILE_STATE
```

QUANTILE_STATE cannot be used as a key column. The aggregation type when creating a table is QUANTILE_UNION.

The user does not need to specify the length and default value. The system will determine the length according to the data aggregation degree.

The QUANTILE_STATE column can only be queried or used by its supporting functions such as `QUANTILE_PERCENT`, `QUANTILE_UNION`, and `TO_QUANTILE_STATE`.

QUANTILE_STATE is a type used for calculating the approximate value of quantiles. In the loading process, different values with the same key will be pre-aggregated. If the number of aggregated values is less than 2048, all data will be recorded in detail; otherwise the [TDigest] algorithm (https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) will be used to aggregate (cluster) the data and save the centroid points after clustering.

**Related Functions:**

```
QUANTILE_UNION(QUANTILE_STATE)
```

This is an aggregation function, which is used to aggregate the intermediate results of different quantile calculations. The result returned by this function is still QUANTILE_STATE

```
TO_QUANTILE_STATE(INT/FLOAT/DOUBLE raw_data [,FLOAT compression])
```

This function converts a numeric type to a QUANTILE_STATE type. The compression parameter is optional and can be set in the range of [2048, 10000]. The larger the compression value, the higher the precision of quantile approximation calculations, the greater the memory consumption, and the longer the calculation time. If the compression parameter is not specified or set beyond [2048, 10000], the system will consider it to be 2048.

```
QUANTILE_PERCENT(QUANTILE_STATE)
```

This function converts the intermediate result variable (QUANTILE_STATE) of the quantile calculation into a specific quantile value.

### Example

```
select QUANTILE_PERCENT(QUANTILE_UNION(v1)) from test_table group by k1, k2, k3;
```

### Notice

You may enable the QUANTILE_STATE type using the following command: 

```
$ mysql-client > admin set frontend config("enable_quantile_state_type"="true");
```

In this way the QUANTILE_STATE type will be enabled after the FE process is restarted. Or you can add `enable_quantile_state_type=true` in fe.conf to keep it enabled permanently.    


### Keywords

    QUANTILE_STATE, QUANTILE_UNION, TO_QUANTILE_STATE, QUANTILE_PERCENT
