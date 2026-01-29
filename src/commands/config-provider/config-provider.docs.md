# 📖 `clever config-provider` command reference

## ➡️ `clever config-provider` <kbd>Since 4.6.0</kbd>

List configuration providers

```bash
clever config-provider [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever config-provider env` <kbd>Since 4.6.0</kbd>

List environment variables of a configuration provider

```bash
clever config-provider env <addon-id|config-provider-id|addon-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|config-provider-id|addon-name`|Add-on ID, real ID (config_xxx) or name (if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json, shell) (default: human)|

## ➡️ `clever config-provider env import` <kbd>Since 4.6.0</kbd>

Load environment variables from STDIN
(WARNING: this deletes all current variables and replaces them with the new list loaded from STDIN)

```bash
clever config-provider env import <addon-id|config-provider-id|addon-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|config-provider-id|addon-name`|Add-on ID, real ID (config_xxx) or name (if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Input format (name-equals-value, json) (default: name-equals-value)|

## ➡️ `clever config-provider env rm` <kbd>Since 4.6.0</kbd>

Remove an environment variable from a configuration provider

```bash
clever config-provider env rm <addon-id|config-provider-id|addon-name> <variable-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|config-provider-id|addon-name`|Add-on ID, real ID (config_xxx) or name (if unambiguous)|
|`variable-name`|Name of the environment variable|

## ➡️ `clever config-provider env set` <kbd>Since 4.6.0</kbd>

Add or update an environment variable named <variable-name> with the value <variable-value>

```bash
clever config-provider env set <addon-id|config-provider-id|addon-name> <variable-name> <variable-value>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|config-provider-id|addon-name`|Add-on ID, real ID (config_xxx) or name (if unambiguous)|
|`variable-name`|Name of the environment variable|
|`variable-value`|Value of the environment variable|

## ➡️ `clever config-provider open` <kbd>Since 4.6.0</kbd>

Open the configuration provider in Clever Cloud Console

```bash
clever config-provider open <addon-id|config-provider-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|config-provider-id|addon-name`|Add-on ID, real ID (config_xxx) or name (if unambiguous)|
