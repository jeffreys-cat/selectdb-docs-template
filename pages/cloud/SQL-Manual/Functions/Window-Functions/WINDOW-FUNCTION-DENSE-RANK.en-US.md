---
{
    "title": "WINDOW-FUNCTION-DENSE_RANK",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## WINDOW FUNCTION DENSE_RANK
### Description

This function is used to represent rankings. Unlike `RANK()`, it does not allow vacancies. For example, if there are two parallel elements that should both be ranked 1, then the third rank in `RANK()` will be 3, but that in `DENSE_RANK()` will be 2.

```sql
DENSE_RANK() OVER(partition_by_clause order_by_clause)
```

### Example

Rank column x based on the property column:

```sql
 select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
 
 | x  | y    | rank     |
 |----|------|----------|
 | 1  | 1    | 1        |
 | 1  | 2    | 2        |
 | 1  | 2    | 2        |
 | 2  | 1    | 1        |
 | 2  | 2    | 2        |
 | 2  | 3    | 3        |
 | 3  | 1    | 1        |
 | 3  | 1    | 1        |
 | 3  | 2    | 2        |
```

### Keywords

    WINDOW,FUNCTION,DENSE_RANK