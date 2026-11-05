# 📖 `clever rebuild` command reference

## ➡️ `clever rebuild` <kbd>Unreleased</kbd>

Restart an application without using cache

```bash
clever rebuild [options]
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

### 🔁 Same as `clever restart --without-cache`

`clever rebuild` redeploys the application exactly like `clever restart --without-cache`: the build phase runs again without reusing the build cache. As with `clever restart`, it uses the commit already deployed on Clever Cloud (or the one given with `--commit`), local changes are not pushed: use `clever deploy` for that.
