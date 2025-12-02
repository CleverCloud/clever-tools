# 📖 `clever published-config` command reference

## ➡️ `clever published-config`

Manage the configuration made available to other applications by this application

```bash
clever published-config [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever published-config import`

Load published configuration from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever published-config import [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `--json` | Import variables as JSON (an array of { "name": "THE\_NAME", "value": "THE\_VALUE" } objects) |

## ➡️ `clever published-config rm`

Remove a published configuration variable from an application

```bash
clever published-config rm [FLAGS] <VARIABLE-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever published-config set`

Add or update a published configuration item named <variable-name> with the value <variable-value>

```bash
clever published-config set [FLAGS] <VARIABLE-NAME> <VARIABLE-VALUE>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable **(required)** |
| `variable-value` | Value of the environment variable **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
