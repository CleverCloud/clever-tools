# Clever Cloud Logs Drains

You can use Clever Tools to control logs drains, through following commands. Each can target a specific application, adding `--app APP_ID_OR_NAME` or a local alias (`--alias`, `-a`), or a specific add-on, adding `--addon ADDON_ID`:

```
clever drain
clever drain -F json
clever drain create <DRAIN-TYPE> ...
clever drain get <DRAIN-ID>
clever drain get <DRAIN-ID> --format json
clever drain check <DRAIN-ID>
clever drain remove <DRAIN-ID>
clever drain enable <DRAIN-ID>
clever drain disable <DRAIN-ID>
```

There is one `clever drain create` subcommand per drain type, each exposing only the options it supports:

```
clever drain create betterstack <DRAIN-URL> --source-token SOURCE_TOKEN
clever drain create datadog <DRAIN-URL>
clever drain create elasticsearch <DRAIN-URL> --index-prefix INDEX_PREFIX [--username USERNAME] [--password PASSWORD]
clever drain create newrelic <DRAIN-URL> --api-key API_KEY
clever drain create ovh-tcp <DRAIN-URL> [--sd-params SD_PARAMS]
clever drain create raw-http <DRAIN-URL> [--username USERNAME] [--password PASSWORD]
clever drain create splunk <DRAIN-URL> --hec-token HEC_TOKEN [--index INDEX] [--sourcetype SOURCETYPE] [--tls-verification MODE]
clever drain create syslog-tcp <DRAIN-URL> [--sd-params SD_PARAMS]
clever drain create syslog-udp <DRAIN-URL> [--sd-params SD_PARAMS]
```

Each subcommand is documented in the [`clever drain` command reference](../src/commands/drain/drain.docs.md), with its own options and examples.

Once a drain exists, `clever drain check <DRAIN-ID>` verifies that its recipient is reachable and accepts deliveries.
