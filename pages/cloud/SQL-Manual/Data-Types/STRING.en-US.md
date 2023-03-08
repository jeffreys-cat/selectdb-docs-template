---
{
    "title": "STRING",
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

## STRING
### Description
```
STRING
```

A variable-length string. The maximum (default) size of it is 1048576 byte (1MB). The length of a string type is also restrained by the BE configuration `string_type_length_soft_limit_bytes`.  The actual maximum length that can be stored is the lesser of the above two. The string type can only be used in the value column, but not in the key, partition, or bucket columns.

**Note:** 

Variable-length strings are stored using UTF-8 encoding, which means English characters occupy 1 byte, and Chinese characters occupy 3 bytes.

### Keywords
```
STRING
```

