# 📖 `clever keycloak` command reference

## ➡️ `clever keycloak`

Manage Clever Cloud Keycloak services

```bash
clever keycloak [FLAGS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak disable-ng`

Unlink Keycloak from its Network Group

```bash
clever keycloak disable-ng <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak enable-ng`

Link Keycloak to a Network Group, used for multi-instances secure communication

```bash
clever keycloak enable-ng <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak get`

Get information about a deployed Keycloak

```bash
clever keycloak get [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak open`

Open the Keycloak dashboard in Clever Cloud Console

```bash
clever keycloak open <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak open logs`

Open the Keycloak application logs in Clever Cloud Console

```bash
clever keycloak open logs <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak open webui`

Open the Keycloak admin console in your browser

```bash
clever keycloak open webui <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak rebuild`

Rebuild Keycloak

```bash
clever keycloak rebuild <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak restart`

Restart Keycloak

```bash
clever keycloak restart <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

## ➡️ `clever keycloak version`

Check Keycloak deployed version

```bash
clever keycloak version [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak version check`

Check Keycloak deployed version

```bash
clever keycloak version check [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak version update`

Update Keycloak deployed version

```bash
clever keycloak version update [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
