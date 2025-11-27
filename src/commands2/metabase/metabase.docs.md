# 📖 `clever metabase` command reference

## ➡️ `clever metabase`

Manage Clever Cloud Metabase services

```bash
clever metabase [FLAGS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase get`

Get information about a deployed Metabase

```bash
clever metabase get [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase open`

Open the Metabase dashboard in Clever Cloud Console

```bash
clever metabase open <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever metabase open logs`

Open the Metabase application logs in Clever Cloud Console

```bash
clever metabase open logs <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever metabase open webui`

Open the Metabase admin console in your browser

```bash
clever metabase open webui <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever metabase rebuild`

Rebuild Metabase

```bash
clever metabase rebuild <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever metabase restart`

Restart Metabase

```bash
clever metabase restart <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever metabase version`

Manage Metabase deployed version

```bash
clever metabase version [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase version check`

Check Metabase deployed version

```bash
clever metabase version check [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever metabase version update`

Update Metabase deployed version

```bash
clever metabase version update [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
