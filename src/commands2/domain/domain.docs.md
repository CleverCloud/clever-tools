# 📖 `clever domain` command reference

## ➡️ `clever domain`

Manage domain names for an application

```bash
clever domain [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever domain add`

Add a domain name to an application

```bash
clever domain add [FLAGS] <FQDN>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `fqdn` | Domain name of the application **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever domain diag`

Check if domains associated to a specific app are properly configured

```bash
clever domain diag [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--filter` `<TEXT>` | Check only domains containing the provided text |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever domain favourite`

Manage the favourite domain name for an application

```bash
clever domain favourite [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever domain favourite set`

Set the favourite domain for an application

```bash
clever domain favourite set [FLAGS] <FQDN>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `fqdn` | Domain name of the application **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever domain favourite unset`

Unset the favourite domain for an application

```bash
clever domain favourite unset [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever domain overview`

Get an overview of all your domains (all orgas, all apps)

```bash
clever domain overview [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--filter` `<TEXT>` | Get only domains containing the provided text |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever domain rm`

Remove a domain name from an application

```bash
clever domain rm [FLAGS] <FQDN>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `fqdn` | Domain name of the application **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
