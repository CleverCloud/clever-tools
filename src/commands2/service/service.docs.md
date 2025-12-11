# 📖 `clever service` command reference

## ➡️ `clever service` <kbd>Since 0.5.0</kbd>

Manage service dependencies

```bash
clever service [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever service link-addon` <kbd>Since 0.5.0</kbd>

Link an existing add-on to this application

```bash
clever service link-addon <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever service link-app` <kbd>Since 0.5.0</kbd>

Add an existing app as a dependency

```bash
clever service link-app <app-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `app-id` | Application ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever service unlink-addon` <kbd>Since 0.5.0</kbd>

Unlink an add-on from this application

```bash
clever service unlink-addon <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever service unlink-app` <kbd>Since 0.5.0</kbd>

Remove an app from the dependencies

```bash
clever service unlink-app <app-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `app-id` | Application ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<app-id\|app-name>` | Application to manage by its ID (or name, if unambiguous) |
