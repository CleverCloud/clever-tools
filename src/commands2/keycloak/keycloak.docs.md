# 📖 `clever keycloak` command reference

## ➡️ `clever keycloak` <kbd>Since 3.13.0</kbd>

Manage Clever Cloud Keycloak services

```bash
clever keycloak [options]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak disable-ng` <kbd>Since 3.13.0</kbd>

Unlink Keycloak from its Network Group

```bash
clever keycloak disable-ng <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak enable-ng` <kbd>Since 3.13.0</kbd>

Link Keycloak to a Network Group, used for multi-instances secure communication

```bash
clever keycloak enable-ng <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak get` <kbd>Since 3.13.0</kbd>

Get information about a deployed Keycloak

```bash
clever keycloak get <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak open` <kbd>Since 3.13.0</kbd>

Open the Keycloak dashboard in Clever Cloud Console

```bash
clever keycloak open <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak open logs` <kbd>Since 3.13.0</kbd>

Open the Keycloak application logs in Clever Cloud Console

```bash
clever keycloak open logs <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak open webui` <kbd>Since 3.13.0</kbd>

Open the Keycloak admin console in your browser

```bash
clever keycloak open webui <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak rebuild` <kbd>Since 3.13.0</kbd>

Rebuild Keycloak

```bash
clever keycloak rebuild <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak restart` <kbd>Since 3.13.0</kbd>

Restart Keycloak

```bash
clever keycloak restart <addon-id>
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

## ➡️ `clever keycloak version` <kbd>Since 3.13.0</kbd>

Check Keycloak deployed version

```bash
clever keycloak version <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak version check` <kbd>Since 3.13.0</kbd>

Check Keycloak deployed version

```bash
clever keycloak version check <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever keycloak version update` <kbd>Since 3.13.0</kbd>

Update Keycloak deployed version

```bash
clever keycloak version update <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--target` `<version>` | Target version to upgrade to (e.g.: 24, 2.4, 2.4.1) |
