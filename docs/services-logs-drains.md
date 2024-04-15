# Clever Cloud Logs Drains

You can use Clever Tools to control logs drains:

```
clever drain [--alias <alias>]
clever drain create [--alias <alias>] <DRAIN-TYPE> <DRAIN-URL> [--username <username>] [--password <password>]
clever drain remove [--alias <alias>] <DRAIN-ID>
```

Where `DRAIN-TYPE` is one of:

- `TCPSyslog`: for TCP syslog endpoint
- `UDPSyslog`: for UDP syslog endpoint
- `HTTP`: for TCP syslog endpoint (note that this endpoint has optional username/password parameters as HTTP Basic Authentication)
- `ElasticSearch`: for ElasticSearch endpoint (note that this endpoint requires username/password parameters as HTTP Basic Authentication)
- `DatadogHTTP`: for Datadog endpoint (note that this endpoint needs your Datadog API Key)
- `NewRelicHTTP`: for NewRelic endpoint (note that this endpoint needs your NewRelic API Key)

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
