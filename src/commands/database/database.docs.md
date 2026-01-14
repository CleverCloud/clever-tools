# 📖 `clever database` command reference

## ➡️ `clever database` <kbd>Since 2.10.0</kbd>

Manage databases and backups

```bash
clever database
```

## ➡️ `clever database backups` <kbd>Since 2.10.0</kbd>

List available database backups

```bash
clever database backups <database-id|addon-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`database-id|addon-id`|Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever database backups download` <kbd>Since 2.10.0</kbd>

Download a database backup

```bash
clever database backups download <database-id|addon-id> <backup-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`database-id|addon-id`|Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)|
|`backup-id`|A Database backup ID (format: UUID)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--output`, `--out` `<file-path>`|Redirect the output of the command in a file|
