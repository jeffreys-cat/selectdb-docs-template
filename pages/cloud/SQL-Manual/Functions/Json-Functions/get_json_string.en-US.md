---
{
    "title": "get_json_string",
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

## get_json_string
### Description
**Syntax:**

`VARCHAR get_json_string (VARCHAR json str, VARCHAR json path)`


This function parses and fetches the strings of the specified path in the JSON string. `json_path` must start with the `$` symbol and use `.` as the path splitter. If the path contains `.`, you may put the path in double quotation marks. Please use [] to denote array subscripts (starting from 0). The path itself may not contain double quotation marks, comma, and square brackets. If the `json_string` or `json_path` is in the wrong format, or if the specified item cannot be found, the function will return NULL.

### Example

1. Get the value whose key is "k1"

```
mysql> SELECT get_json_string('{"k1":"v1", "k2":"v2"}', "$.k1");
+---------------------------------------------------+
| get_json_string('{"k1":"v1", "k2":"v2"}', '$.k1') |
+---------------------------------------------------+
| v1                                                |
+---------------------------------------------------+
```

2. Get the second element of the array whose key is "my. key"

```
mysql> SELECT get_json_string('{"k1":"v1", "my.key":["e1", "e2", "e3"]}', '$."my.key"[1]');
+------------------------------------------------------------------------------+
| get_json_string('{"k1":"v1", "my.key":["e1", "e2", "e3"]}', '$."my.key"[1]') |
+------------------------------------------------------------------------------+
| e2                                                                           |
+------------------------------------------------------------------------------+
```

3. Get the first element in an array whose secondary path is k1. key - > K2
```
mysql> SELECT get_json_string('{"k1.key":{"k2":["v1", "v2"]}}', '$."k1.key".k2[0]');
+-----------------------------------------------------------------------+
| get_json_string('{"k1.key":{"k2":["v1", "v2"]}}', '$."k1.key".k2[0]') |
+-----------------------------------------------------------------------+
| v1                                                                    |
+-----------------------------------------------------------------------+
```

4. Get all the values in the array whose keys are "k1"
```
mysql> SELECT get_json_string('[{"k1":"v1"}, {"k2":"v2"}, {"k1":"v3"}, {"k1":"v4"}]', '$.k1');
+---------------------------------------------------------------------------------+
| get_json_string('[{"k1":"v1"}, {"k2":"v2"}, {"k1":"v3"}, {"k1":"v4"}]', '$.k1') |
+---------------------------------------------------------------------------------+
| ["v1","v3","v4"]                                                                |
+---------------------------------------------------------------------------------+
```
### Keywords
```
GET_JSON_STRING,GET,JSON,STRING
```

