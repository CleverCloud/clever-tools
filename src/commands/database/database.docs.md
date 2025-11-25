# 📖 `clever database` command reference

## ➡️ `clever database`

Manage databases and backups

```bash
clever database [OPTIONS]
```

## ➡️ `clever database backups`

List available database backups

```bash
clever database backups [OPTIONS] <DATABASE-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `database-id` | Any database ID (format: addon\_UUID, postgresql\_UUID, mysql\_UUID, ...) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever database backups download`

Download a database backup

```bash
clever database backups download [OPTIONS] <BACKUP-ID> <DATABASE-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `backup-id` | A Database backup ID (format: UUID) |
| `database-id` | Any database ID (format: addon\_UUID, postgresql\_UUID, mysql\_UUID, ...) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-out`, `--output` `<output>` | Redirect the output of the command in a file |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |
