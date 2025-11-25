# 📖 `clever metabase` command reference

## ➡️ `clever metabase`

Manage Clever Cloud Metabase services

```bash
clever metabase [OPTIONS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever metabase get`

Get information about a deployed Metabase

```bash
clever metabase get [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever metabase open`

Open the Metabase dashboard in Clever Cloud Console

```bash
clever metabase open [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase open logs`

Open the Metabase application logs in Clever Cloud Console

```bash
clever metabase open logs [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase open webui`

Open the Metabase admin console in your browser

```bash
clever metabase open webui [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase rebuild`

Rebuild Metabase

```bash
clever metabase rebuild [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase restart`

Restart Metabase

```bash
clever metabase restart [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever metabase version`

Manage Metabase deployed version

```bash
clever metabase version [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever metabase version check`

Check Metabase deployed version

```bash
clever metabase version check [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever metabase version update`

Update Metabase deployed version

```bash
clever metabase version update [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
