# 📖 `clever otoroshi` command reference

## ➡️ `clever otoroshi`

Manage Clever Cloud Otoroshi services

```bash
clever otoroshi [FLAGS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever otoroshi disable-ng`

Unlink Otoroshi from its Network Group

```bash
clever otoroshi disable-ng <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi enable-ng`

Link Otoroshi to a Network Group

```bash
clever otoroshi enable-ng <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi get`

Get information about a deployed Otoroshi

```bash
clever otoroshi get [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever otoroshi get-config`

Get configuration of a deployed Otoroshi in otoroshictl format

```bash
clever otoroshi get-config <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi open`

Open the Otoroshi dashboard in Clever Cloud Console

```bash
clever otoroshi open <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi open logs`

Open the Otoroshi application logs in Clever Cloud Console

```bash
clever otoroshi open logs <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi open webui`

Open the Otoroshi admin console in your browser

```bash
clever otoroshi open webui <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi rebuild`

Rebuild Otoroshi

```bash
clever otoroshi rebuild <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi restart`

Restart Otoroshi

```bash
clever otoroshi restart <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever otoroshi version`

Manage Otoroshi deployed version

```bash
clever otoroshi version [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever otoroshi version check`

Check Otoroshi deployed version

```bash
clever otoroshi version check [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever otoroshi version update`

Update Otoroshi deployed version

```bash
clever otoroshi version update [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
