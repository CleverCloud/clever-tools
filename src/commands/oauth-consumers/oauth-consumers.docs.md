# 📖 `clever oauth-consumers` command reference

## ➡️ `clever oauth-consumers` <kbd>Since unreleased</kbd>

Manage OAuth consumers used with a Clever Cloud login

```bash
clever oauth-consumers
```

## ➡️ `clever oauth-consumers create` <kbd>Since unreleased</kbd>

Create an OAuth consumer

```bash
clever oauth-consumers create <name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`name`|Consumer name|

### ⚙️ Options

|Name|Description|
|---|---|
|`--base-url` `<url>`|OAuth callback base URL|
|`-d`, `--description` `<description>`|Consumer description|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--picture` `<url>`|Application logo URL|
|`--rights` `<rights>`|Comma-separated list of rights (access-organisations, access-organisations-bills, access-organisations-consumption-statistics, access-organisations-credit-count, access-personal-information, manage-organisations, manage-organisations-applications, manage-organisations-members, manage-organisations-services, manage-personal-information, manage-ssh-keys, all)|
|`--url` `<url>`|Application home URL|

## ➡️ `clever oauth-consumers delete` <kbd>Since unreleased</kbd>

Delete an OAuth consumer

```bash
clever oauth-consumers delete <consumer-key|consumer-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`consumer-key|consumer-name`|OAuth consumer key (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-y`, `--yes`|Skip confirmation and proceed with deletion directly|

## ➡️ `clever oauth-consumers get` <kbd>Since unreleased</kbd>

Get details of an OAuth consumer

```bash
clever oauth-consumers get <consumer-key|consumer-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`consumer-key|consumer-name`|OAuth consumer key (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--with-secret`|Include the consumer secret in the output|

## ➡️ `clever oauth-consumers list` <kbd>Since unreleased</kbd>

List OAuth consumers

```bash
clever oauth-consumers list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever oauth-consumers open` <kbd>Since unreleased</kbd>

Open an OAuth consumer in the Clever Cloud Console

```bash
clever oauth-consumers open <consumer-key|consumer-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`consumer-key|consumer-name`|OAuth consumer key (or name, if unambiguous)|

## ➡️ `clever oauth-consumers update` <kbd>Since unreleased</kbd>

Update an OAuth consumer

```bash
clever oauth-consumers update <consumer-key|consumer-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`consumer-key|consumer-name`|OAuth consumer key (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`--base-url` `<url>`|OAuth callback base URL|
|`-d`, `--description` `<description>`|Consumer description|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-n`, `--name` `<name>`|Consumer name|
|`--picture` `<url>`|Application logo URL|
|`--rights` `<rights>`|Comma-separated list of rights (access-organisations, access-organisations-bills, access-organisations-consumption-statistics, access-organisations-credit-count, access-personal-information, manage-organisations, manage-organisations-applications, manage-organisations-members, manage-organisations-services, manage-personal-information, manage-ssh-keys, all)|
|`--url` `<url>`|Application home URL|
