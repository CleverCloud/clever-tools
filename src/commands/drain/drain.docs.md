# 📖 `clever drain` command reference

## ➡️ `clever drain` <kbd>Since 0.9.0</kbd>

Manage drains

```bash
clever drain [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever drain create` <kbd>Since 0.9.0</kbd>

Create a drain

```bash
clever drain create <drain-type> <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-type`|No description available|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`-k`, `--api-key` `<api-key>`|API key (for newrelic)|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-i`, `--index-prefix` `<index-prefix>`|Optional index prefix (for elasticsearch), `logstash` value is used if not set|
|`-p`, `--password` `<password>`|Basic auth password (for elasticsearch or raw-http)|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"`|
|`-u`, `--username` `<username>`|Basic auth username (for elasticsearch or raw-http)|

## ➡️ `clever drain disable` <kbd>Since 0.9.0</kbd>

Disable a drain

```bash
clever drain disable <drain-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-id`|Drain ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever drain enable` <kbd>Since 0.9.0</kbd>

Enable a drain

```bash
clever drain enable <drain-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-id`|Drain ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever drain get` <kbd>Since 0.9.0</kbd>

Get drain info

```bash
clever drain get <drain-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-id`|Drain ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever drain remove` <kbd>Since 0.9.0</kbd>

Remove a drain

```bash
clever drain remove <drain-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-id`|Drain ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever drain test-command` <kbd>Since 4.8.0</kbd>

Get a ready-to-execute shell command to test a drain recipient

```bash
clever drain test-command <drain-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-id`|Drain ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
