---
{
"title": "ALTER-POLICY",
"language": "en"
}
---

## ALTER-POLICY

### Name

ALTER STORAGE POLICY

### Description

This statement is used to modify an existing cold-hot separation transfer strategy. Only root or admin users can modify resources.

Syntax:

```sql
ALTER STORAGE POLICY  'policy_name'
PROPERTIES ("key"="value", ...);
```

### Example

1. Modify  the transfer time point for cold-hot separation data named `cooldown_datetime`
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. Modify the transfer countdown for cold-hot separation data named `cooldown_ttl`
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
```
### Keywords

```sql
ALTER, STORAGE, POLICY
```

### Best Practice
