# 📖 `clever metabase` command reference

## ➡️ `clever metabase` <kbd>Since 3.13.0</kbd>

Manage Clever Cloud Metabase services

```bash
clever metabase [options]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase get` <kbd>Since 3.13.0</kbd>

Get information about a deployed Metabase

```bash
clever metabase get <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase open` <kbd>Since 3.13.0</kbd>

Open the Metabase dashboard in Clever Cloud Console

```bash
clever metabase open <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase open logs` <kbd>Since 3.13.0</kbd>

Open the Metabase application logs in Clever Cloud Console

```bash
clever metabase open logs <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase open webui` <kbd>Since 3.13.0</kbd>

Open the Metabase admin console in your browser

```bash
clever metabase open webui <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase rebuild` <kbd>Since 3.13.0</kbd>

Rebuild Metabase

```bash
clever metabase rebuild <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase restart` <kbd>Since 3.13.0</kbd>

Restart Metabase

```bash
clever metabase restart <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase version` <kbd>Since 3.13.0</kbd>

Manage Metabase deployed version

```bash
clever metabase version <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase version check` <kbd>Since 3.13.0</kbd>

Check Metabase deployed version

```bash
clever metabase version check <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase version update` <kbd>Since 3.13.0</kbd>

Update Metabase deployed version

```bash
clever metabase version update <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
