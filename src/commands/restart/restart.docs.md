# 📖 `clever restart` command reference

## ➡️ `clever restart` <kbd>Since 0.4.0</kbd>

Start or restart an application

```bash
clever restart [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--commit` `<commit-id>`|Restart the application with a specific commit ID|
|`-e`, `--exit-on` `<step>`|Step at which the logs streaming is ended (deploy-start, deploy-end, never) (default: deploy-end)|
|`--follow`|Continue to follow logs after deployment has ended *(deprecated, use `--exit-on never` instead)*|
|`-q`, `--quiet`|Don't show logs during deployment|
|`--without-cache`|Restart the application without using cache|
