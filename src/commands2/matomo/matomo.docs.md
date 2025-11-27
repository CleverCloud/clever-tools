# 📖 `clever matomo` command reference

## ➡️ `clever matomo`

Manage Clever Cloud Matomo services

```bash
clever matomo [FLAGS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever matomo get`

Get information about a deployed Matomo

```bash
clever matomo get [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever matomo open`

Open the Matomo dashboard in Clever Cloud Console

```bash
clever matomo open <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever matomo open logs`

Open the Matomo application logs in Clever Cloud Console

```bash
clever matomo open logs <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever matomo open webui`

Open the Matomo admin console in your browser

```bash
clever matomo open webui <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever matomo rebuild`

Rebuild Matomo

```bash
clever matomo rebuild <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever matomo restart`

Restart Matomo

```bash
clever matomo restart <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |
