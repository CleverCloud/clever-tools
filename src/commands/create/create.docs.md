# 📖 `clever create` command reference

## ➡️ `clever create` <kbd>Since 0.2.0</kbd>

Create an application

```bash
clever create --type <instance-type> [<app-name>] [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`app-name`|Application name (current directory name is used if not specified) *(optional)*|

### ⚙️ Options

|Name|Description|
|---|---|
|`-t`, `--type` `<instance-type>`|Instance type **(required)**|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--github` `<owner/repo>`|GitHub application to use for deployments|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`-r`, `--region` `<zone>`|Region, can be 'par', 'parhds', 'grahds', 'rbx', 'rbxhds', 'scw', 'ldn', 'mtl', 'sgp', 'syd', 'wsw' (default: par)|
|`-T`, `--task` `<command>`|The application launch as a task executing the given command, then stopped|
