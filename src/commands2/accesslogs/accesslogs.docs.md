# 📖 `clever accesslogs` command reference

## ➡️ `clever accesslogs`

Fetch access logs

```bash
clever accesslogs [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
| `-until`, `--before` `<before>` | Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h) |
| `-since`, `--after` `<after>` | Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h) |
| `--addon` `<addon_id>` | Add-on ID |
