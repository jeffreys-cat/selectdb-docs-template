---
{
    "title": "SHOW-LAST-INSERT",
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

## SHOW-LAST-INSERT

### Name

SHOW LAST INSERT

### Description

This statement is used to display the result of the latest insert operation in the current session connection

Syntax:

```sql
SHOW LAST INSERT
````

Example of returned result:

````
     TransactionId: 64067
             Label: insert_ba8f33aea9544866-8ed77e2844d0cc9b
          Database: default_cluster:db1
             Table: t1
TransactionStatus: VISIBLE
        LoadedRows: 2
      FilteredRows: 0
````

Description:

* TransactionId: transaction id
* Label: the label corresponding to the insert task
* Database: the database corresponding to the insert task
* Table: the table corresponding to the insert task
* TransactionStatus: transaction status
   * PREPARE: preparation stage
   * PRECOMMITTED: pre-commit stage
   * COMMITTED: the transaction succeeded, but the data were not visible
   * VISIBLE: the transaction succeeded and the data are visible
   * ABORTED: transaction failed
* LoadedRows: number of imported rows
* FilteredRows: the number of rows being filtered

### Example

### Keywords

    SHOW, LASR ,INSERT

### Best Practice

