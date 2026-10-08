# 📖 `clever service-tokens` command reference

## ➡️ `clever service-tokens` <kbd>Since 4.8.0</kbd>

Manage organisation service tokens for machine-to-machine authentication

```bash
clever service-tokens
```

## ➡️ `clever service-tokens create` <kbd>Since 4.8.0</kbd>

Create a service token for an organisation

```bash
clever service-tokens create <token-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`token-name`|Service token name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-d`, `--description` `<description>`|Service token description|
|`-e`, `--expiration` `<expiration>`|Duration until token expiration (e.g.: 1h, 4d, 2w, 6M, 1y) (default: 90d)|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--resources` `<id1,id2,...>`|Scope token to specific resources by app ID, add-on ID, or real ID (comma-separated)|
|`-r`, `--role` `<role>`|Role assigned to the service token (Admin, Manager, Developer, Accounting) (Admin, Manager, Developer, Accounting)|

## ➡️ `clever service-tokens get` <kbd>Since 4.8.0</kbd>

Get details about a service token

```bash
clever service-tokens get <token-id|token-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`token-id|token-name`|Service token ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever service-tokens list` <kbd>Since 4.8.0</kbd>

List service tokens for an organisation

```bash
clever service-tokens list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever service-tokens revoke` <kbd>Since 4.8.0</kbd>

Revoke a service token

```bash
clever service-tokens revoke <token-id|token-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`token-id|token-name`|Service token ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
