# 📖 `clever service` command reference

## ➡️ `clever service`

Manage service dependencies

```bash
clever service [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever service link-addon`

Link an existing add-on to this application

```bash
clever service link-addon [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever service link-app`

Add an existing app as a dependency

```bash
clever service link-app [OPTIONS] <APP-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `app-id` | Application ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever service unlink-addon`

Unlink an add-on from this application

```bash
clever service unlink-addon [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever service unlink-app`

Remove an app from the dependencies

```bash
clever service unlink-app [OPTIONS] <APP-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `app-id` | Application ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--only-apps` | Only show app dependencies |
| `--only-addons` | Only show add-on dependencies |
| `--show-all` | Show all available add-ons and applications |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
