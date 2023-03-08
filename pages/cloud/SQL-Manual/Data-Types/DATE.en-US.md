---
{
    "title": "DATE",
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

## DATE
### Description

DATE Function

**Syntax:**

```
DATE(expr) 
```

Turn the input type into a DATE type
    
The current range of DATE type is ['0000-01-01', '9999-12-31'], and it will be printed as 'YYYY-MM-DD' by default.

### Note
If you use version 1.2 and above, we  strongly recommended that you use the DATEV2 type instead of the DATE type since DATEV2 is more efficient.

### Example
```
mysql> SELECT DATE('2003-12-31 01:02:03');
    -> '2003-12-31'
```
### Keywords
```
DATE
```

