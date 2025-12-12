# 📖 `clever tokens` command reference

## ➡️ `clever tokens` <kbd>Since 3.12.0</kbd>

Manage API tokens to query Clever Cloud API from ${...}

```bash
clever tokens [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever tokens create` <kbd>Since 3.12.0</kbd>

Create an API token

```bash
clever tokens create <api-token-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`api-token-name`|API token name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-e`, `--expiration`, `<expiration>`|Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever tokens revoke` <kbd>Since 3.12.0</kbd>

Revoke an API token

```bash
clever tokens revoke <api-token-id>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`api-token-id`|API token ID|
