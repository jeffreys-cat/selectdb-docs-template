# BITMAP Accurate Deduplication

SelectDB's original Bitmap aggregation function design is relatively general, but its calculation performance for the intersection and union of bitmaps with a large base of more than 100 million levels is poor. The investigation found that there are two main reasons: one is that when the bitmap base is large, such as the bitmap size exceeds 1g, the network/disk IO processing time is relatively long; the other is that the back-end computing nodes transmit all the scan data to the top-level node for intersection The sum operation puts pressure on the top-level single node and becomes a processing bottleneck.

The solution is to divide the values of the bitmap column into ranges, and store the values of different ranges in different buckets to ensure that the bitmap values of different buckets are orthogonal. When querying, the orthogonal bitmaps in different buckets are first aggregated and calculated, and then the top-level nodes directly merge and summarize the aggregated values and output them. This will greatly improve computing efficiency and solve the bottleneck problem of top-level single-node computing.

## Create table

When building a table, you need to use the aggregation model, the data type is bitmap, and the aggregation function is bitmap_union

```sql
CREATE TABLE `user_tag_bitmap` (
  `tag` bigint(20) NULL COMMENT "用户标签",
  `hid` smallint(6) NULL COMMENT "分桶id",
  `bitmap_user_id` bitmap BITMAP_UNION NULL COMMENT ""
) ENGINE=OLAP
AGGREGATE KEY(`tag`, `hid`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`hid`) BUCKETS 3
```



The hid column is added to the table schema, indicating the id range, as a hash bucket column.

Note: The number of hids and BUCKETS should be set reasonably, and the number of hids should be at least 5 times that of BUCKETS, so that the data hash buckets are as balanced as possible.

When data is loaded, if the original data field is user_id, the data type is Bigint. Then when importing, let hid = ceil(user_id/5000000), bitmap_user_id = to_bitmap(user_id).

When loading data, cut the user bitmap value range vertically. For example, if the hid value of the user id in the range of 1-5000000 is the same, the rows with the same hid value will be allocated to a bucket, so the bitmap in each bucket are all orthogonal. You can use the orthogonality of the bitmap values in the bucket to perform intersection and union calculations, and the calculation results will be shuffled to the top node for aggregation.

Note: The orthogonal bitmap function cannot be used in the partition table, because the partition table partition is orthogonal, the data between partitions cannot be guaranteed to be orthogonal, and the calculation result is also unpredictable.

## bitmap_orthogonal_intersect

Find bitmap intersection function

grammar:

orthogonal_bitmap_intersect(bitmap_column, column_to_filter, filter_values)

parameter:

The first parameter is the Bitmap column, the second parameter is the dimension column used for filtering, and the third parameter is a variable-length parameter, which means to filter different values of the dimension column

illustrate:

Aggregation in query planning is divided into two layers. In the first layer of be nodes (update, serialize), hash aggregation is performed according to filter_values as the key, and then the bitmaps of all keys are intersected. The results are serialized and sent to the second layer of be nodes (merge , finalize), in the second-level be node, the union of all the bitmap values from the first-level nodes is cyclically calculated

Example:

```sql
select BITMAP_COUNT(orthogonal_bitmap_intersect(user_id, tag, 13080800, 11110200)) from user_tag_bitmap  where tag in (13080800, 11110200);
```



## orthogonal_bitmap_intersect_count

Find the bitmap intersection count function, the syntax is the same as the original intersect_count, but the implementation is different

grammar:

orthogonal_bitmap_intersect_count(bitmap_column, column_to_filter, filter_values)

parameter:

The first parameter is the Bitmap column, the second parameter is the dimension column used for filtering, and the third parameter starts with a variable length parameter, which means to filter different values of the dimension column

illustrate:

The query planning aggregation is divided into two layers. On the first layer, be nodes (update, serialize) perform hash aggregation based on filter_values as the key, and then calculate the intersection of the bitmaps of all keys, and then calculate the count of the intersection result, and send the count value after serialization Go to the second-level be node (merge, finalize), and in the second-level be node, calculate the sum of all the count values from the first-level nodes

## orthogonal_bitmap_union_count

Find the count function of bitmap union, the syntax is the same as the original bitmap_union_count, but the implementation is different.

grammar:

orthogonal_bitmap_union_count(bitmap_column)

parameter:

The parameter type is bitmap, which is the column of the union count to be sought

illustrate:

The query plan is divided into two layers. In the first layer of be nodes (update, serialize), all bitmaps are combined, and then the result of the union is counted, and the count value is serialized and sent to the second layer of be nodes (merge, serialize). finalize), in the second-level be node, calculate the sum of all the count values from the first-level nodes

## Scenario

Compatible with the scenario of orthogonal calculation of bitmap, such as in user behavior analysis, calculation retention, funnel, user portrait, etc.

Crowd selection:

```sql
select orthogonal_bitmap_intersect_count(user_id, tag, 13080800, 11110200) from user_tag_bitmap where tag in (13080800, 11110200);
Note: 13080800, 11110200 represent user labels
```

Calculate the deduplication value of user_id:

```sql
select orthogonal_bitmap_union_count(user_id) from user_tag_bitmap where tag in (13080800, 11110200);
```