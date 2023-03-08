---
{
"title": "extract_url_parameter",
"language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE 
file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on 
an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## extract_url_parameter
### Description
**Syntax:**

`VARCHAR  extract_url_parameter(VARCHAR url, VARCHAR  name)`

This function returns the value of the parameter with the name  `name` in `url` (if there exists such a parameter); otherwise, it will return an empty string. If there are multiple parameters with the name  `name` , it will return the first one.
This function works assuming that the parameter name is encoded in the URL exactly as it was in the passed parameter.

### Example

```
mysql> SELECT extract_url_parameter ("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2");
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```

### Keywords
    EXTRACT URL PARAMETER
