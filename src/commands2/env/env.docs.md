# 📖 `clever env` command reference

## ➡️ `clever env` <kbd>Since 0.2.0</kbd>

Manage environment variables of an application

```bash
clever env [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever env import` <kbd>Since 0.3.0</kbd>

Load environment variables from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever env import [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |
| `--json` | Import variables as JSON (an array of { "name": "THE\_NAME", "value": "THE\_VALUE" } objects) |

## ➡️ `clever env import-vars` <kbd>Since 2.0.0</kbd>

Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment

```bash
clever env import-vars <variable-names> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `variable-names` | Comma separated list of names of the environment variables |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever env rm` <kbd>Since 0.3.0</kbd>

Remove an environment variable from an application

```bash
clever env rm <variable-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever env set` <kbd>Since 0.3.0</kbd>

Add or update an environment variable named <variable-name> with the value <variable-value>

```bash
clever env set <variable-name> <variable-value> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable |
| `variable-value` | Value of the environment variable |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |
