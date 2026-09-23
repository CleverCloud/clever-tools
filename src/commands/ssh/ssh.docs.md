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
|`--instance` `<instance-id\|number\|any>`|Instance to connect to, by ID or number, or `any` (skips interactive selection). Build VMs are only picked by ID, or by `any` when no other instance is running|

### Examples

```bash
clever ssh --instance 0 -c hostname     # instance number 0
clever ssh --instance any -c hostname   # any running instance, a build VM only if nothing else runs
clever ssh --instance <build-vm-id>     # connect to a build VM
```
