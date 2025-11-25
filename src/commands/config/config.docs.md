# 📖 `clever config` command reference

## ➡️ `clever config`

Display or edit the configuration of your application

```bash
clever config [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever config get`

Display the current configuration

```bash
clever config get [OPTIONS] <CONFIGURATION-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `configuration-name` | Configuration to manage: ${...} |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever config set`

Edit one configuration setting

```bash
clever config set [OPTIONS] <CONFIGURATION-VALUE> <CONFIGURATION-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `configuration-value` | The new value of the configuration |
| `configuration-name` | Configuration to manage: ${...} |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever config update`

Edit multiple configuration settings at once

```bash
clever config update [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
