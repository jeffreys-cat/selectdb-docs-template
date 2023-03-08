---
{
    "title": "SHOW-GRANTS",
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

## SHOW-GRANTS

### Name

SHOW GRANTS

### Description

 This statement is used to view user privileges.

Syntax:

```sql
SHOW [ALL] GRANTS [FOR user_identity];
```

Note:

1. SHOW ALL GRANTS can view the permissions of all users.
2. If user_identity is specified, the system will display the privileges of the specified user. And the user_identity must be an existing one created by the CREATE USER command.
3. If user_identity is not specified, the system will display the privileges of the current user.

### Example

1. View all user privileges

    ```sql
    SHOW ALL GRANTS;
    ````

2. View the privileges of the specified user

    ```sql
    SHOW GRANTS FOR jack@'%';
    ````

3. View the privileges of the current user

    ```sql
    SHOW GRANTS;
    ````

### Keywords

    SHOW, GRANTS

### Best Practice

