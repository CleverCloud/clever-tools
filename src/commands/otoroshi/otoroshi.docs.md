# 📖 `clever otoroshi` command reference

## ➡️ `clever otoroshi`

Manage Clever Cloud Otoroshi services

```bash
clever otoroshi [OPTIONS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever otoroshi disable-ng`

Unlink Otoroshi from its Network Group

```bash
clever otoroshi disable-ng [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi enable-ng`

Link Otoroshi to a Network Group

```bash
clever otoroshi enable-ng [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi get`

Get information about a deployed Otoroshi

```bash
clever otoroshi get [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever otoroshi get-config`

Get configuration of a deployed Otoroshi in otoroshictl format

```bash
clever otoroshi get-config [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi open`

Open the Otoroshi dashboard in Clever Cloud Console

```bash
clever otoroshi open [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi open logs`

Open the Otoroshi application logs in Clever Cloud Console

```bash
clever otoroshi open logs [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi open webui`

Open the Otoroshi admin console in your browser

```bash
clever otoroshi open webui [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi rebuild`

Rebuild Otoroshi

```bash
clever otoroshi rebuild [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi restart`

Restart Otoroshi

```bash
clever otoroshi restart [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever otoroshi version`

Manage Otoroshi deployed version

```bash
clever otoroshi version [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever otoroshi version check`

Check Otoroshi deployed version

```bash
clever otoroshi version check [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever otoroshi version update`

Update Otoroshi deployed version

```bash
clever otoroshi version update [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
