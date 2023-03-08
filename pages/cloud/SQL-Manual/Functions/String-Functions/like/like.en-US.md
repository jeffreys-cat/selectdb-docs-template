---
{
    "title": "like",
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

## like
### Description
**Syntax:**

`BOOLEAN like(VARCHAR str, VARCHAR pattern)`

This function performs fuzzy matching on the string `str`. If the string matches the condition, it will return true; if it doesn't, it will return false.

The `like` match/fuzzy match will be used in combination with % and _.

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

// Return the data containing "a" in the k1 string
mysql> select k1 from test where k1 like '%a%';
+-------+
| k1    |
+-------+
| a     |
| bab   |
+-------+

// Return the data equal to "a" in the k1 string
mysql> select k1 from test where k1 like 'a';
+-------+
| k1    |
+-------+
| a     |
+-------+
```

### Keywords
    LIKE
