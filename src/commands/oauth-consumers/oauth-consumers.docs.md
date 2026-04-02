# 📖 `clever oauth-consumers` command reference

## ➡️ `clever oauth-consumers` <kbd>Since 4.8.0</kbd>

Manage OAuth consumers used with a Clever Cloud login

```bash
clever oauth-consumers
```

## ➡️ `clever oauth-consumers create` <kbd>Since 4.8.0</kbd>

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

## ➡️ `clever oauth-consumers delete` <kbd>Since 4.8.0</kbd>

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
|`-y`, `--yes`|Skip confirmation and delete the OAuth consumer directly|

## ➡️ `clever oauth-consumers get` <kbd>Since 4.8.0</kbd>

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

## ➡️ `clever oauth-consumers list` <kbd>Since 4.8.0</kbd>

List OAuth consumers

```bash
clever oauth-consumers list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever oauth-consumers open` <kbd>Since 4.8.0</kbd>

Open the OAuth consumers page in the Clever Cloud Console

```bash
clever oauth-consumers open [<consumer-key|consumer-name>] [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`consumer-key|consumer-name`|OAuth consumer key or name (opens list page if omitted) *(optional)*|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever oauth-consumers update` <kbd>Since 4.8.0</kbd>

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
