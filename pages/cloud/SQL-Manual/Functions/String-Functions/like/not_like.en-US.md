---
{
    "title": "not like",
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

## not like
### Description
**Syntax:**

`BOOLEAN not like(VARCHAR str, VARCHAR pattern)`

This function performs fuzzy matching on the string `str`. If the string matches the condition, it will return false; if it doesn't, it will return true.

The `not_like` match/fuzzy match will be used in combination with % and _.

`%` represents zero, one, or more characters.

`_` represents a single character.

```
'a'   // Precise matching, has the same effect as "="
'%a'  // data ending with "a"
'a%'  // data starting with "a"
'%a%' // data containing "a"
'_a_' // three-digit data with "a" as the middle character
'_a'  // two-digit data with "a" as the last character
'a_'  // two-digit data with "a" as the first character
'a__b'  // four-digit data with "a" as the first character and "b" as the last character
```
### Example

```
// table test
+-------+
| k1    |
+-------+
| b     |
| bb    |
| bab   |
| a     |
+-------+

// Return data that does not contain "a" in the k1 string
mysql> select k1 from test where k1 not like '%a%';
+-------+
| k1    |
+-------+
| b     |
| bb    |
+-------+

// Return the data that is not equal to "a" in the k1 string
mysql> select k1 from test where k1 not like 'a';
+-------+
| k1    |
+-------+
| b     |
| bb    |
| bab   |
+-------+
```

### Keywords
    LIKE, NOT, NOT LIKE
