# 📖 `clever ssh-keys` command reference

## ➡️ `clever ssh-keys` <kbd>Since 3.13.0</kbd>

Manage SSH keys of the current user

```bash
clever ssh-keys [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever ssh-keys add` <kbd>Since 3.13.0</kbd>

Add a new SSH key to the current user

```bash
clever ssh-keys add <ssh-key-path> <ssh-key-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`ssh-key-path`|SSH public key path (.pub)|
|`ssh-key-name`|SSH key name|

## ➡️ `clever ssh-keys open` <kbd>Since 3.13.0</kbd>

Open the SSH keys management page in the Console

```bash
clever ssh-keys open
```

## ➡️ `clever ssh-keys remove` <kbd>Since 3.13.0</kbd>

Remove a SSH key from the current user

```bash
clever ssh-keys remove <ssh-key-name>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`ssh-key-name`|SSH key name|

## ➡️ `clever ssh-keys remove-all` <kbd>Since 3.13.0</kbd>

Remove all SSH keys from the current user

```bash
clever ssh-keys remove-all [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-y`, `--yes`|Skip confirmation and remove all SSH keys directly|
