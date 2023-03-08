---
{
    "title": "BITMAP_UNION",
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


## BITMAP_UNION

### Description

### Example

#### Create table

Creating a table requires the use of the aggregation model. The data type is bitmap and the aggregation function is bitmap_union.
```
CREATE TABLE `pv_bitmap` (
  `dt` int (11) NULL COMMENT" ",
  `page` varchar (10) NULL COMMENT" ",
  `user_id` bitmap BITMAP_UNION NULL COMMENT" "
) ENGINE = OLAP
AGGREGATE KEY (`dt`,` page`)
COMMENT "OLAP"
DISTRIBUTED BY HASH (`dt`) BUCKETS 2;
```

Note: 

When handling large data volumes, it is better to create a corresponding rollup table for high-frequency bitmap_union queries.

```
ALTER TABLE pv_bitmap ADD ROLLUP pv (page, user_id);
```

#### Data Load

`TO_BITMAP (expr)`: convert 0 ~ 18446744073709551615 unsigned bigint to bitmap

`BITMAP_EMPTY ()`: generate empty bitmap columns, used for default value filling for insert or loading

`BITMAP_HASH (expr)` or `BITMAP_HASH64 (expr)`: convert a column of any type to a bitmap by way of hashing

##### Stream Load

```
cat data | curl --location-trusted -u user: passwd -T--H "columns: dt, page, user_id, user_id = to_bitmap (user_id)" http: // host: 8410 / api / test / testDb / _stream_load
```

```
cat data | curl --location-trusted -u user: passwd -T--H "columns: dt, page, user_id, user_id = bitmap_hash (user_id)" http: // host: 8410 / api / test / testDb / _stream_load
```

```
cat data | curl --location-trusted -u user: passwd -T--H "columns: dt, page, user_id, user_id = bitmap_empty ()" http: // host: 8410 / api / test / testDb / _stream_load
```

##### Insert Into

The column type of id2 is bitmap
```
insert into bitmap_table1 select id, id2 from bitmap_table2;
```

The column type of id2 is bitmap
```
INSERT INTO bitmap_table1 (id, id2) VALUES (1001, to_bitmap (1000)), (1001, to_bitmap (2000));
```

The column type of id2 is bitmap
```
insert into bitmap_table1 select id, bitmap_union (id2) from bitmap_table2 group by id;
```

The column type of id2 is int
```
insert into bitmap_table1 select id, to_bitmap (id2) from table;
```

The column type of id2 is string
```
insert into bitmap_table1 select id, bitmap_hash (id_string) from table;
```


#### Data Query

##### Syntax:

`BITMAP_UNION (expr)`: calculate the union of two bitmaps and return a new bitmap value

`BITMAP_UNION_COUNT (expr)`: calculate the union of two bitmaps and return its cardinality, equivalent to `BITMAP_COUNT (BITMAP_UNION (expr))`. We recommend the `BITMAP_UNION_COUNT` function since its performance is better than `BITMAP_COUNT (BITMAP_UNION (expr))`.

`BITMAP_UNION_INT (expr)`: calculate the number of different values in columns of type TINYINT, SMALLINT and INT, its return result is the same as that of `COUNT (DISTINCT expr)`

`INTERSECT_COUNT (bitmap_column_to_count, filter_column, filter_values ...)`: calculate the cardinality value of intersection of multiple bitmaps that meet the conditions of `filter_column`.
`bitmap_column_to_count` is a column of bitmap type, `filter_column` is a varying dimension column, and `filter_values` is a list of dimension values.

##### Example

The following SQL uses the `pv_bitmap table` above as an example:

Calculate the deduplication value for user_id:

```
select bitmap_union_count (user_id) from pv_bitmap;

select bitmap_count (bitmap_union (user_id)) from pv_bitmap;
```

Calculate the deduplication value of id:

```
select bitmap_union_int (id) from pv_bitmap;
```

Calculate the retention of user_id:

```
select intersect_count (user_id, page, 'meituan') as meituan_uv,
intersect_count (user_id, page, 'waimai') as waimai_uv,
intersect_count (user_id, page, 'meituan', 'waimai') as retention // Number of users appearing on both 'meituan' and 'waimai' pages
from pv_bitmap
where page in ('meituan', 'waimai');
```

### Keywords

```
BITMAP, BITMAP_COUNT, BITMAP_EMPTY, BITMAP_UNION, BITMAP_UNION_INT, TO_BITMAP, BITMAP_UNION_COUNT, INTERSECT_COUNT
```

