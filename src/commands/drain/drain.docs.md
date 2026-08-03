# 📖 `clever drain` command reference

## ➡️ `clever drain` <kbd>Since 0.9.0</kbd>

Manage drains

```bash
clever drain [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever drain check` <kbd>Since 4.11.0</kbd>

Check that a drain's recipient is reachable and accepts deliveries

```bash
clever drain check <drain-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-id`|Drain ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
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
|`drain-type`|Drain type (betterstack, datadog, elasticsearch, newrelic, ovh-tcp, raw-http, splunk, syslog-tcp, syslog-udp)|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|

### ⚙️ Options for `betterstack`

|Name|Description|
|---|---|
|`-t`, `--source-token` `<source-token>`|Source token|

### ⚙️ Options for `elasticsearch`

|Name|Description|
|---|---|
|`-i`, `--index-prefix` `<index-prefix>`|Optional index prefix, `logstash` value is used if not set|
|`-p`, `--password` `<password>`|Basic auth password|
|`-u`, `--username` `<username>`|Basic auth username|

### ⚙️ Options for `newrelic`

|Name|Description|
|---|---|
|`-k`, `--api-key` `<api-key>`|API key|

### ⚙️ Options for `ovh-tcp`

|Name|Description|
|---|---|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters, e.g.: `X-OVH-TOKEN=\"REDACTED\"`|

### ⚙️ Options for `raw-http`

|Name|Description|
|---|---|
|`-p`, `--password` `<password>`|Basic auth password|
|`-u`, `--username` `<username>`|Basic auth username|

### ⚙️ Options for `splunk`

|Name|Description|
|---|---|
|`--hec-token` `<hec-token>`|HTTP Event Collector token|
|`--index` `<index>`|Optional target index, the HEC token's own index is used if not set|
|`--sourcetype` `<sourcetype>`|Optional sourcetype, the HEC token's own sourcetype is used if not set|
|`--tls-verification` `<tls-verification>`|TLS verification mode, use `trustful` to accept a self-signed certificate (default, trustful)|

### ⚙️ Options for `syslog-tcp`

|Name|Description|
|---|---|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters, e.g.: `X-OVH-TOKEN=\"REDACTED\"`|

### ⚙️ Options for `syslog-udp`

|Name|Description|
|---|---|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters, e.g.: `X-OVH-TOKEN=\"REDACTED\"`|

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
|`--addon` `<addon-id>`|Add-on ID or real ID|
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
|`--addon` `<addon-id>`|Add-on ID or real ID|
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
|`--addon` `<addon-id>`|Add-on ID or real ID|
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
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
