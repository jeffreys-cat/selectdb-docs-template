# Time Zone Setting

SelectDB supports multiple time zone settings

There are multiple time zone related parameters inside SelectDB

- system_time_zone : When the server starts, it will be automatically set according to the machine setting time zone, and cannot be modified after setting.
- time_zone : the current time zone of the server, distinguish between session level and global level

## Show and set time zone

1. show variables like '%time_zone%'

   View the current time zone related configuration

2. SET time_zone = 'Asia/Shanghai'

   This command can set the time zone at the session level, and it will fail after the connection is disconnected

3. SET global time_zone = 'Asia/Shanghai'

   This command can set the time zone parameter at the global level, fe will persist the parameter, and it will not fail after the connection is disconnected

### Effect of time zone setting

Time zone settings affect the display and storage of time zone-sensitive time values. This includes values displayed by time functions like NOW() or CURTIME(), as well as time values returned by some commands.

But it will not affect the less than value of the time type partition column in create table, nor will it affect the display of the value stored as date/datetime type.

Functions affected by timezone:

- `FROM_UNIXTIME`: Given a UTC timestamp, returns the datetime in the specified time zone: eg `FROM_UNIXTIME(0)`, returns the CST time zone: `1970-01-01 08:00:00`.
- `UNIX_TIMESTAMP`: Given a specified time zone date and time, return UTC timestamp: such as CST time zone `UNIX_TIMESTAMP('1970-01-01 08:00:00')`, return `0`.
- `CURTIME`: Returns the time in the specified time zone.
- `NOW`: Return the date and time in the specified local time zone.
- `CONVERT_TZ`: Convert a datetime from one specified time zone to another specified time zone.

## Usage restrictions

Time zone values can be given in several formats, case insensitive:

- A string representing the UTC offset, such as '+10:00' or '-6:00'
- Standard time zone format, such as "Asia/Shanghai", "America/Los_Angeles"
- Abbreviated time zone formats such as "MET", "CTT" are not supported. Because the abbreviated time zone is ambiguous in different scenarios, it is not recommended to use it.
- In order to be compatible with some processing of SelectDB, it supports CST abbreviated time zone, and internally transfers CST to the Chinese standard time zone of "Asia/Shanghai"

## [List](https://cn-selectdb-com.translate.goog/cloud-docs/使用指南/其他/时区设置/?_x_tr_sl=auto&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp#时区格式列表) of time zone formats

[List of tz database time zones](https://translate.google.com/website?sl=auto&tl=zh-CN&hl=zh-CN&client=webapp&u=https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)