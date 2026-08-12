# 📖 `clever ssh` command reference

## ➡️ `clever ssh` <kbd>Since 0.7.0</kbd>

Connect to running instances through SSH

```bash
clever ssh [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-c`, `--command` `<command>`|Execute a command on the remote instance and exit|
|`-i`, `--identity-file` `<identity-file>`|SSH identity file|
|`--instance` `<instance-id>`|Instance ID to connect to (skips interactive selection)|
