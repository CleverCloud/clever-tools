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
|`--type` `<drain-type>`|Only list drains of this type (betterstack, datadog, elasticsearch, newrelic, ovh-tcp, raw-http, sekoia, splunk, syslog-tcp, syslog-udp)|

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
clever drain create
```

## ➡️ `clever drain create betterstack` <kbd>Since 4.11.0</kbd>

Create a Better Stack drain

```bash
clever drain create betterstack --source-token <source-token> <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`-t`, `--source-token` `<source-token>`|Source token **(required)**|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|

### Examples

To create a [Better Stack](https://betterstack.com/docs/logs/http-rest-api/) drain, use the ingesting host of your source, along with its source token:

```bash
clever drain create betterstack "https://<INGESTING_HOST>" --source-token <SOURCE_TOKEN>
```

## ➡️ `clever drain create datadog` <kbd>Since 0.9.0</kbd>

Create a Datadog drain

```bash
clever drain create datadog <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|

### Examples

[Datadog](https://docs.datadoghq.com/api/?lang=python#send-logs-over-http) has two zones, EU and COM. An account on one zone is not available on the other, so make sure you target the right intake endpoint:

```bash
# EU
clever drain create datadog "https://http-intake.logs.datadoghq.eu/v1/input/<API_KEY>?ddsource=clevercloud&service=<SERVICE>&host=<HOST>"
# US
clever drain create datadog "https://http-intake.logs.datadoghq.com/v1/input/<API_KEY>?ddsource=clevercloud&service=<SERVICE>&host=<HOST>"
```

The `host` query parameter is not mandatory: in the Datadog pipeline configuration, you can map `@source_host`, the host provided by Clever Cloud in logs, as the `host` property.

## ➡️ `clever drain create elasticsearch` <kbd>Since 0.9.0</kbd>

Create an Elasticsearch drain

```bash
clever drain create elasticsearch --index-prefix <index-prefix> <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL, must end with '/_bulk'|

### ⚙️ Options

|Name|Description|
|---|---|
|`-i`, `--index-prefix` `<index-prefix>`|Index prefix, indexes are created as `<index-prefix>-YYYY-MM-DD` **(required)**|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`-p`, `--password` `<password>`|Basic auth password|
|`-u`, `--username` `<username>`|Basic auth username|

### Examples

Elasticsearch drains use the Elastic bulk API. To match this endpoint, add `/_bulk` at the end of your Elasticsearch endpoint:

```bash
clever drain create elasticsearch "https://<HOST>/_bulk" --index-prefix logstash --username <USERNAME> --password <PASSWORD>
```

`--username` and `--password` are optional, use them when your cluster requires basic authentication.

## ➡️ `clever drain create newrelic` <kbd>Since 0.9.0</kbd>

Create a New Relic drain

```bash
clever drain create newrelic --api-key <api-key> <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`-k`, `--api-key` `<api-key>`|API key **(required)**|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|

### Examples

[New Relic](https://docs.newrelic.com/docs/logs/log-api/introduction-log-api/) has two zones, EU and US. An account on one zone is not available on the other, so make sure you target the right intake endpoint:

```bash
clever drain create newrelic "https://log-api.eu.newrelic.com/log/v1" --api-key <API_KEY>
```

## ➡️ `clever drain create ovh-tcp` <kbd>Since 0.9.0</kbd>

Create an OVH TCP drain

```bash
clever drain create ovh-tcp <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters, e.g.: `token=\"REDACTED\"`|

### Examples

OVH TCP drains are syslog drains sent over TCP to an OVH Logs Data Platform endpoint. The OVH token is passed as an RFC5424 structured data parameter:

```bash
clever drain create ovh-tcp "tcp://<HOST>:514" --sd-params 'X-OVH-TOKEN="<OVH_TOKEN>"'
```

## ➡️ `clever drain create raw-http` <kbd>Since 0.9.0</kbd>

Create a raw HTTP drain

```bash
clever drain create raw-http <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`-p`, `--password` `<password>`|Basic auth password|
|`-u`, `--username` `<username>`|Basic auth username|

### Examples

Raw HTTP drains POST log batches as JSON to any HTTP endpoint. Basic authentication is optional:

```bash
clever drain create raw-http "https://<HOST>/<PATH>"
clever drain create raw-http "https://<HOST>/<PATH>" --username <USERNAME> --password <PASSWORD>
```

## ➡️ `clever drain create sekoia` <kbd>Since 5.3.0</kbd>

Create a Sekoia.io drain

```bash
clever drain create sekoia --intake-key <intake-key> <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--intake-key` `<intake-key>`|Intake key **(required)**|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`--tls-verification` `<tls-verification>`|TLS verification mode, use `trustful` for a self-hosted intake behind a private CA (default, trustful)|

### Examples

[Sekoia.io](https://docs.sekoia.io/integration/ingestion_methods/https/overview/) drains post to the `/jsons` endpoint of an HTTPS intake, which reads each log as an event. The intake host depends on the region of your Sekoia.io workspace, FRA1 being the default:

```bash
clever drain create sekoia "https://intake.sekoia.io/jsons" --intake-key <INTAKE_KEY>
```

On other regions, use `https://intake.<REGION>.sekoia.io/api/v1/intake-http/jsons`. The intake key is sent in a header, don't add it to the URL as `?intake_key=`: the API refuses it, as it does a URL that is not `https` or doesn't end with `/jsons`.

## ➡️ `clever drain create splunk` <kbd>Since 5.0.0</kbd>

Create a Splunk HEC drain

```bash
clever drain create splunk --hec-token <hec-token> <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--hec-token` `<hec-token>`|HTTP Event Collector token **(required)**|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--index` `<index>`|Optional target index, the HEC token's own index is used if not set|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`--sourcetype` `<sourcetype>`|Optional sourcetype, the HEC token's own sourcetype is used if not set|
|`--tls-verification` `<tls-verification>`|TLS verification mode, use `trustful` to accept a self-signed certificate (default, trustful)|

## ➡️ `clever drain create syslog-tcp` <kbd>Since 0.9.0</kbd>

Create a Syslog TCP drain

```bash
clever drain create syslog-tcp <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters, e.g.: `token=\"REDACTED\"`|

### Examples

Syslog TCP drains forward logs in the RFC5424 format, over a TCP connection. Use `--sd-params` when your collector expects structured data parameters, such as an authentication token:

```bash
clever drain create syslog-tcp "tcp://<HOST>:<PORT>"
clever drain create syslog-tcp "tcp://<HOST>:<PORT>" --sd-params 'token="<TOKEN>"'
```

## ➡️ `clever drain create syslog-udp` <kbd>Since 0.9.0</kbd>

Create a Syslog UDP drain

```bash
clever drain create syslog-udp <drain-url> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`drain-url`|Drain URL|

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID or real ID|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--kind` `<kind>`|Kind of logs sent to the drain (LOG, ACCESSLOG) (default: LOG)|
|`-s`, `--sd-params` `<sd-params>`|RFC5424 structured data parameters, e.g.: `token=\"REDACTED\"`|

### Examples

Syslog UDP drains forward logs in the RFC5424 format, over UDP, which means without any delivery guarantee. Use `--sd-params` when your collector expects structured data parameters, such as an authentication token:

```bash
clever drain create syslog-udp "udp://<HOST>:<PORT>"
clever drain create syslog-udp "udp://<HOST>:<PORT>" --sd-params 'token="<TOKEN>"'
```

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

## ➡️ `clever drain list` <kbd>Since 5.3.0</kbd>

List the drains of all applications and add-ons

```bash
clever drain list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--type` `<drain-type>`|Only list drains of this type (betterstack, datadog, elasticsearch, newrelic, ovh-tcp, raw-http, sekoia, splunk, syslog-tcp, syslog-udp)|

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
