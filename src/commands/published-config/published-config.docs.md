# 📖 `clever published-config` command reference

## ➡️ `clever published-config` <kbd>Since 0.5.0</kbd>

Manage the configuration made available to other applications by this application

```bash
clever published-config [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format` `<format>`|Output format (human, json, shell) (default: human)|

## ➡️ `clever published-config import` <kbd>Since 0.5.0</kbd>

Load published configuration from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever published-config import [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--json`|Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects)|

## ➡️ `clever published-config rm` <kbd>Since 0.5.0</kbd>

Remove a published configuration variable from an application

```bash
clever published-config rm <variable-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`variable-name`|Name of the environment variable|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever published-config set` <kbd>Since 0.5.0</kbd>

Add or update a published configuration item named <variable-name> with the value <variable-value>

```bash
clever published-config set <variable-name> <variable-value> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`variable-name`|Name of the environment variable|
|`variable-value`|Value of the environment variable|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
