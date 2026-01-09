# 📖 `clever logs` command reference

## ➡️ `clever logs` <kbd>Since 0.2.0</kbd>

Fetch application logs, continuously

```bash
clever logs [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`--addon` `<addon-id>`|Add-on ID|
|`--after`, `--since` `<after>`|Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--before`, `--until` `<before>`|Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)|
|`--deployment-id` `<deployment-id>`|Fetch logs for a given deployment|
|`-F`, `--format` `<format>`|Output format (human, json, json-stream) (default: human)|
|`--search` `<search>`|Fetch logs matching this pattern|
