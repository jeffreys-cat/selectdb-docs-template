---
{
    "title": "DATEV2",
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

## DATEV2

DATEV2

### Description
Syntax:

```
DATEV2
```

The current range of DATEV2 is ['0000-01-01','9999-12-31'], and it will be printed as 'YYYYY-MM-DD' by default.

### Note
DATEV2 is more efficient than DATE. The memory usage of DATEV2 is only half of that of DATE.

### Example
```
mysql> SELECT CAST('2003-12-31 01:02:03' as DATEV2);
    -> '2003-12-31'
```

### Keywords
```
DATEV2
```

