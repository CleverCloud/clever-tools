# 📖 `clever instances` command reference

## ➡️ `clever instances` <kbd>Since 5.1.0</kbd>

List instances of an application

```bash
clever instances [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`--after`, `--since` `<after>`|List instances that existed after this date/time, in any state (ISO8601 date, positive number in seconds or duration, e.g.: 1h)|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--all`|List instances in any state, including deleted ones (default: only running instances)|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--before`, `--until` `<before>`|List instances that existed before this date/time, in any state (ISO8601 date, positive number in seconds or duration, e.g.: 1h)|
|`--deployment-id` `<deployment-id>`|List instances created by this deployment, in any state|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--limit` `<limit>`|Maximum number of instances to list, keeping the most recent ones (1 to 1000) (default: 100)|
