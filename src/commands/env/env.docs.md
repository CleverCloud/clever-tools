# 📖 `clever env` command reference

## ➡️ `clever env`

Manage environment variables of an application

```bash
clever env [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

### 💡 Tips

Like many other commands, `clever env` supports `--format json` but here, you can also do `--format shell` for a sourceable script with `export` statements.

```bash
clever env --format shell > .env
source .env
```

You can even source it on the fly like this:

```bash
source <(clever env --format shell)
```

## ➡️ `clever env import`

Load environment variables from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever env import [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `--json` | Import variables as JSON (an array of { "name": "THE\_NAME", "value": "THE\_VALUE" } objects) |

## ➡️ `clever env import-vars`

Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment

```bash
clever env import-vars [OPTIONS] <VARIABLE-NAMES>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-names` | Comma separated list of names of the environment variables |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever env rm`

Remove an environment variable from an application

```bash
clever env rm [OPTIONS] <VARIABLE-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever env set`

Add or update an environment variable named <variable-name> with the value <variable-value>

```bash
clever env set [OPTIONS] <VARIABLE-NAME> <VARIABLE-VALUE>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `variable-name` | Name of the environment variable |
| `variable-value` | Value of the environment variable |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--add-export` | Display sourceable env variables setting |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
