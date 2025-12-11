# 📖 `clever matomo` command reference

## ➡️ `clever matomo` <kbd>Since 3.13.0</kbd>

Manage Clever Cloud Matomo services

```bash
clever matomo [options]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever matomo get` <kbd>Since 3.13.0</kbd>

Get information about a deployed Matomo

```bash
clever matomo get <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever matomo open` <kbd>Since 3.13.0</kbd>

Open the Matomo dashboard in Clever Cloud Console

```bash
clever matomo open <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo open logs` <kbd>Since 3.13.0</kbd>

Open the Matomo application logs in Clever Cloud Console

```bash
clever matomo open logs <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo open webui` <kbd>Since 3.13.0</kbd>

Open the Matomo admin console in your browser

```bash
clever matomo open webui <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo rebuild` <kbd>Since 3.13.0</kbd>

Rebuild Matomo

```bash
clever matomo rebuild <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo restart` <kbd>Since 3.13.0</kbd>

Restart Matomo

```bash
clever matomo restart <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |
