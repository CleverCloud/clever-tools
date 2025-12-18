# 📖 `clever config` command reference

## ➡️ `clever config` <kbd>Since 2.5.0</kbd>

Display or edit the configuration of your application

```bash
clever config [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever config get` <kbd>Since 2.5.0</kbd>

Display the current configuration

```bash
clever config get <configuration-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`configuration-name`|Configuration to manage: name, description, zero-downtime, sticky-sessions, cancel-on-push, force-https, or task|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever config set` <kbd>Since 2.5.0</kbd>

Edit one configuration setting

```bash
clever config set <configuration-name> <configuration-value> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`configuration-name`|Configuration to manage: name, description, zero-downtime, sticky-sessions, cancel-on-push, force-https, or task|
|`configuration-value`|The new value of the configuration|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever config update` <kbd>Since 2.5.0</kbd>

Edit multiple configuration settings at once

```bash
clever config update [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--description` `<description>`|Set application description|
|`--disable-cancel-on-push`|Disable cancel on push|
|`--disable-force-https`|Disable force HTTPS redirection|
|`--disable-sticky-sessions`|Disable sticky sessions|
|`--disable-task`|Disable application as Clever Task|
|`--disable-zero-downtime`|Disable zero-downtime deployment|
|`--enable-cancel-on-push`|Enable cancel on push|
|`--enable-force-https`|Enable force HTTPS redirection|
|`--enable-sticky-sessions`|Enable sticky sessions|
|`--enable-task`|Enable application as Clever Task|
|`--enable-zero-downtime`|Enable zero-downtime deployment|
|`--name` `<name>`|Set application name|
