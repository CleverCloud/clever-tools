# 📖 `clever tokens` command reference

## ➡️ `clever tokens`

Manage API tokens to query Clever Cloud API from ${...}

```bash
clever tokens [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever tokens create`

Create an API token

```bash
clever tokens create [FLAGS] <API-TOKEN-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `api-token-name` | API token name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-e`, `--expiration` `<expiration>` | Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever tokens revoke`

Revoke an API token

```bash
clever tokens revoke <API-TOKEN-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `api-token-id` | API token ID **(required)** |
