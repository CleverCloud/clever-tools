# 📖 `clever published-config` command reference

## ➡️ `clever published-config`

Manage the configuration made available to other applications by this application

```bash
clever published-config [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever published-config import`

Load published configuration from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever published-config import [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `--json` | Import variables as JSON (an array of { "name": "THE\_NAME", "value": "THE\_VALUE" } objects) |

## ➡️ `clever published-config rm`

Remove a published configuration variable from an application

```bash
clever published-config rm [OPTIONS] <VARIABLE-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever published-config set`

Add or update a published configuration item named <variable-name> with the value <variable-value>

```bash
clever published-config set [OPTIONS] <VARIABLE-NAME> <VARIABLE-VALUE>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable |
| `variable-value` | Value of the environment variable |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
