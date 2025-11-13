# Clever Cloud Logs Drains

You can use Clever Tools to control logs drains, through following commands. Each can target a specific application, adding `--app APP_ID_OR_NAME` or a local alias (`--alias`, `-a`):

```
clever drain
clever drain -F json
clever drain create <DRAIN-TYPE> <DRAIN-URL>
clever drain get <DRAIN-ID>
clever drain get <DRAIN-ID> --format json
clever drain remove <DRAIN-ID>
clever drain enable <DRAIN-ID>
clever drain disable <DRAIN-ID>
```

Where `DRAIN-TYPE` is one of:

- `datadog`: for Datadog endpoint (note that this endpoint needs your Datadog API Key)
- `elasticsearch`: for ElasticSearch endpoint (note that this endpoint requires username/password parameters as HTTP Basic Authentication)
- `newrelic`: for NewRelic endpoint (note that this endpoint needs your NewRelic API Key)
- `ovh-tcp`: for OVH TCP syslog endpoint (note that this endpoint has an optional sd-params parameter)
- `raw-http`: for HTTP endpoint (note that this endpoint has optional username/password parameters as HTTP Basic Authentication)
- `syslog-tcp`: for TCP syslog endpoint
- `syslog-udp`: for UDP syslog endpoint

Drain creation supports the following options:

```
[--username, -u] USERNAME             Basic auth username (for elasticsearch or raw-http)
[--password, -p] PASSWORD             Basic auth password (for elasticsearch or raw-http)
[--api-key, -k] API_KEY               API key (for newrelic)
[--index-prefix, -i] INDEX_PREFIX     Optional index prefix (for elasticsearch), `logstash` value is used if not set
[--sd-params, -s] SD_PARAMS           RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"`
```

## ElasticSearch logs drains

ElasticSearch drains use the Elastic bulk API. To match this endpoint, specify `/_bulk` at the end of your ElasticSearch endpoint.

## Datadog logs drains

Datadog has two zones, EU and COM. An account on one zone is not available on the other, make sure to target the good EU or COM intake endpoint.

To create a [Datadog](https://docs.datadoghq.com/api/?lang=python#send-logs-over-http) drain, you just need to use one of the following command depending on your zone:

```
# EU
clever drain create DatadogHTTP "https://http-intake.logs.datadoghq.eu/v1/input/<API_KEY>?ddsource=clevercloud&service=<SERVICE>&host=<HOST>"
# US
clever drain create DatadogHTTP "https://http-intake.logs.datadoghq.com/v1/input/<API_KEY>?ddsource=clevercloud&service=<SERVICE>&host=<HOST>"
```

The `host` query parameter is not mandatory: in the Datadog pipeline configuration, you can map `@source_host` which is the host provided by Clever Cloud in logs as `host` property.

## NewRelic logs drains

NewRelic has two zones, EU and US. An account on one zone is not available on the other, make sure to target the good EU or US intake endpoint.

To create a [NewRelic](https://docs.newrelic.com/docs/logs/log-api/introduction-log-api/) drain, you just need to use:

```
clever drain create NewRelicHTTP "https://log-api.eu.newrelic.com/log/v1" --api-key <API_KEY>
```
