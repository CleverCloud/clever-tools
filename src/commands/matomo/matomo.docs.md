# 📖 `clever matomo` command reference

## ➡️ `clever matomo`

Manage Clever Cloud Matomo services

```bash
clever matomo [OPTIONS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever matomo get`

Get information about a deployed Matomo

```bash
clever matomo get [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever matomo open`

Open the Matomo dashboard in Clever Cloud Console

```bash
clever matomo open [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo open logs`

Open the Matomo application logs in Clever Cloud Console

```bash
clever matomo open logs [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo open webui`

Open the Matomo admin console in your browser

```bash
clever matomo open webui [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo rebuild`

Rebuild Matomo

```bash
clever matomo rebuild [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever matomo restart`

Restart Matomo

```bash
clever matomo restart [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |
