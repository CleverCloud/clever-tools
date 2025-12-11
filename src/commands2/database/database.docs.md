# 📖 `clever database` command reference

## ➡️ `clever database` <kbd>Since 2.10.0</kbd>

Manage databases and backups

```bash
clever database
```

## ➡️ `clever database backups` <kbd>Since 2.10.0</kbd>

List available database backups

```bash
clever database backups <database-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `database-id` | Any database ID (format: addon\_UUID, postgresql\_UUID, mysql\_UUID, ...) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever database backups download` <kbd>Since 2.10.0</kbd>

Download a database backup

```bash
clever database backups download <backup-id> <database-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `backup-id` | A Database backup ID (format: UUID) |
| `database-id` | Any database ID (format: addon\_UUID, postgresql\_UUID, mysql\_UUID, ...) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-out`, `--output` `<output>` | Redirect the output of the command in a file |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
