# 📖 `clever tokens` command reference

## ➡️ `clever tokens` <kbd>Since 3.12.0</kbd>

Manage API tokens to query Clever Cloud API from https://api-bridge.clever-cloud.com

```bash
clever tokens [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

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
|`-e`, `--expiration` `<expiration>`|Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M) (default: 1y)|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever tokens metrics` <kbd>Unreleased</kbd>

Manage the Warp 10 tokens used to query your metrics

```bash
clever tokens metrics
```

## ➡️ `clever tokens metrics gen` <kbd>Unreleased</kbd>

Generate a Warp 10 read token to query your metrics

```bash
clever tokens metrics gen [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--apps` `<applications>`|Comma separated list of platform applications the token grants read access to|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`-t`, `--ttl` `<ttl>`|Token lifespan, as an ISO 8601 duration (e.g.: P5D, PT12H) or a "1h, 4d, 2w" like duration|

## ➡️ `clever tokens revoke` <kbd>Since 3.12.0</kbd>

Revoke an API token

```bash
clever tokens revoke <api-token-id>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`api-token-id`|API token ID|
