# 📖 `clever domain` command reference

## ➡️ `clever domain` <kbd>Since 0.2.0</kbd>

Manage domain names for an application

```bash
clever domain [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever domain add` <kbd>Since 0.2.0</kbd>

Add a domain name to an application

```bash
clever domain add <fqdn> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`fqdn`|Domain name of the application|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever domain diag` <kbd>Since 3.9.0</kbd>

Check if domains associated to a specific app are properly configured

```bash
clever domain diag [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--filter`, `<text>`|Check only domains containing the provided text|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever domain favourite` <kbd>Since 2.7.0</kbd>

Manage the favourite domain name for an application

```bash
clever domain favourite [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever domain favourite set` <kbd>Since 2.7.0</kbd>

Set the favourite domain for an application

```bash
clever domain favourite set <fqdn> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`fqdn`|Domain name of the application|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever domain favourite unset` <kbd>Since 2.7.0</kbd>

Unset the favourite domain for an application

```bash
clever domain favourite unset [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever domain overview` <kbd>Since 3.9.0</kbd>

Get an overview of all your domains (all orgas, all apps)

```bash
clever domain overview [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`--filter`, `<text>`|Get only domains containing the provided text|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever domain rm` <kbd>Since 0.2.0</kbd>

Remove a domain name from an application

```bash
clever domain rm <fqdn> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`fqdn`|Domain name of the application|

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
