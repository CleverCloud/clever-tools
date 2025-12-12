# 📖 `clever otoroshi` command reference

> [!NOTE]
> 🧪 **Experimental**: This command may change or be removed in future versions.
> Enable with: `clever features enable operators`

## ➡️ `clever otoroshi` <kbd>Since 3.13.0</kbd>

Manage Clever Cloud Otoroshi services

```bash
clever otoroshi [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever otoroshi disable-ng` <kbd>Since 3.13.0</kbd>

Unlink Otoroshi from its Network Group

```bash
clever otoroshi disable-ng <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi enable-ng` <kbd>Since 3.13.0</kbd>

Link Otoroshi to a Network Group

```bash
clever otoroshi enable-ng <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi get` <kbd>Since 3.13.0</kbd>

Get information about a deployed Otoroshi

```bash
clever otoroshi get <addon-id|addon-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever otoroshi get-config` <kbd>Since 4.4.0</kbd>

Get configuration of a deployed Otoroshi in otoroshictl format

```bash
clever otoroshi get-config <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi open` <kbd>Since 3.13.0</kbd>

Open the Otoroshi dashboard in Clever Cloud Console

```bash
clever otoroshi open <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi open logs` <kbd>Since 3.13.0</kbd>

Open the Otoroshi application logs in Clever Cloud Console

```bash
clever otoroshi open logs <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi open webui` <kbd>Since 3.13.0</kbd>

Open the Otoroshi admin console in your browser

```bash
clever otoroshi open webui <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi rebuild` <kbd>Since 3.13.0</kbd>

Rebuild Otoroshi

```bash
clever otoroshi rebuild <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi restart` <kbd>Since 3.13.0</kbd>

Restart Otoroshi

```bash
clever otoroshi restart <addon-id|addon-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

## ➡️ `clever otoroshi version` <kbd>Since 3.13.0</kbd>

Manage Otoroshi deployed version

```bash
clever otoroshi version <addon-id|addon-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever otoroshi version check` <kbd>Since 3.13.0</kbd>

Check Otoroshi deployed version

```bash
clever otoroshi version check <addon-id|addon-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever otoroshi version update` <kbd>Since 3.13.0</kbd>

Update Otoroshi deployed version

```bash
clever otoroshi version update <addon-id|addon-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`addon-id|addon-name`|Add-on ID (or name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`--target`, `<version>`|Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)|
