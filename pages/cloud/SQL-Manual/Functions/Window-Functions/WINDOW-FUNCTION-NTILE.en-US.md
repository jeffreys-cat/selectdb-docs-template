---
{
    "title": "WINDOW-FUNCTION-NTILE",
    "language": "en"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## WINDOW FUNCTION NTILE
### Description

For `NTILE(n)`, this function will divide rows in a partition into a specific number of groups (in this case, `n` buckets). Only when the previous bucket is full can the data be put into the next bucket. Each bucket is assigned a number starting from one. For the case that cannot be distributed evenly, rows are preferentially allocated to the bucket with the smaller number. The row number difference between buckets cannot be more than 1. For now, n must be a positive integer.

```sql
NTILE(n) OVER(partition_by_clause order_by_clause)
```

### Example

```sql
select x, y, ntile(2) over(partition by x order by y) as ntile from int_t;

| x | y    | rank     |
|---|------|----------|
| 1 | 1    | 1        |
| 1 | 2    | 1        |
| 1 | 2    | 2        |
| 2 | 1    | 1        |
| 2 | 2    | 1        |
| 2 | 3    | 2        |
| 3 | 1    | 1        |
| 3 | 1    | 1        |
| 3 | 2    | 2        |
```

### Keywords

    WINDOW,FUNCTION,NTILE