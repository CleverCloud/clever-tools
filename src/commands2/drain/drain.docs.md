# 📖 `clever drain` command reference

## ➡️ `clever drain`

Manage drains

```bash
clever drain [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever drain create`

Create a drain

```bash
clever drain create [FLAGS] <DRAIN-TYPE> <DRAIN-URL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `drain-type` | No description available **(required)** |
| `drain-url` | Drain URL **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-u`, `--username` `<username>` | Basic auth username (for elasticsearch or raw-http) |
| `-p`, `--password` `<password>` | Basic auth password (for elasticsearch or raw-http) |
| `-k`, `--api-key` `<api_key>` | API key (for newrelic) |
| `-i`, `--index-prefix` `<index_prefix>` | Optional index prefix (for elasticsearch), `logstash` value is used if not set |
| `-s`, `--sd-params` `<sd_params>` | RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"` |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever drain disable`

Disable a drain

```bash
clever drain disable [FLAGS] <DRAIN-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `drain-id` | Drain ID **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever drain enable`

Enable a drain

```bash
clever drain enable [FLAGS] <DRAIN-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `drain-id` | Drain ID **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever drain get`

Get drain info

```bash
clever drain get [FLAGS] <DRAIN-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `drain-id` | Drain ID **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever drain remove`

Remove a drain

```bash
clever drain remove [FLAGS] <DRAIN-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `drain-id` | Drain ID **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
