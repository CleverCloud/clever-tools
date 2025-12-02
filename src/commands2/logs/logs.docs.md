# 📖 `clever logs` command reference

## ➡️ `clever logs`

Fetch application logs, continuously

```bash
clever logs [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--search` `<search>` | Fetch logs matching this pattern |
| `--deployment-id` `<deployment_id>` | Fetch logs for a given deployment |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-until`, `--before` `<before>` | Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h) |
| `-since`, `--after` `<after>` | Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h) |
| `--addon` `<addon_id>` | Add-on ID |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
