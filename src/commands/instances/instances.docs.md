# 📖 `clever instances` command reference

## ➡️ `clever instances` <kbd>Unreleased</kbd>

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

### How it works

* By default, only running instances are listed. `--all`, `--after`, `--before` and `--deployment-id` also include stopped and deleted instances, and filters combine.
* `--limit` keeps the most recent instances, which are then listed from oldest to newest.
* `#` is the instance number within its deployment: it restarts at 0 on each deployment, `build` marks a build VM and `?` a number not known yet, at the very beginning of booting. Dates are in UTC.

### Examples

```bash
clever instances                                   # running instances
clever instances --all --limit 10                  # last 10 instances, any state
clever instances --deployment-id <deployment-id>   # instances created by a deployment
clever instances --after 1d                        # instances that existed during the last day
```
