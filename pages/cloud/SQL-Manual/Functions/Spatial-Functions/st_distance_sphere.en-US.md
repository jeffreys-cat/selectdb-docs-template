---
{
    "title": "ST_Distance_Sphere",
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

## ST_Distance_Sphere
### Description
**Syntax:**

`DOUBLE ST_Distance_Sphere(DOUBLE x_lng, DOUBLE x_lat, DOUBLE y_lng, DOUBLE y_lat)`


This function calculates the spherical distance between two points of the earth (measured in meters). The input arguments are the longitude and latitude of point X and Y. 

x_lng and y_lng are longitudes. They should be in the range [-180, 180].
x_lat and y_lat are latitudes. They should be in the range [-90, 90].

### Example

```
mysql> select st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
+----------------------------------------------------------------------------+
| st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+----------------------------------------------------------------------------+
|                                                         7336.9135549995917 |
+----------------------------------------------------------------------------+
```
### Keywords
```
ST_DISTANCE_SPHERE,ST,DISTANCE,SPHERE
```

