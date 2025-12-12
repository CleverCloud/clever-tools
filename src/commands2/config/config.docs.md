# 📖 `clever config` command reference

## ➡️ `clever config` <kbd>Since 2.5.0</kbd>

Display or edit the configuration of your application

```bash
clever config [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever config get` <kbd>Since 2.5.0</kbd>

Display the current configuration

```bash
clever config get <configuration-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`configuration-name`|Configuration to manage: ${...}|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever config set` <kbd>Since 2.5.0</kbd>

Edit one configuration setting

```bash
clever config set <configuration-value> <configuration-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`configuration-value`|The new value of the configuration|
|`configuration-name`|Configuration to manage: ${...}|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever config update` <kbd>Since 2.5.0</kbd>

Edit multiple configuration settings at once

```bash
clever config update [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
