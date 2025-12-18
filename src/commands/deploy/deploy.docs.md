# 📖 `clever deploy` command reference

## ➡️ `clever deploy` <kbd>Since 0.2.0</kbd>

Deploy an application

```bash
clever deploy [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias` `<alias>`|Short name for the application|
|`-b`, `--branch` `<branch>`|Branch to push (current branch by default)|
|`-e`, `--exit-on` `<step>`|Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)|
|`--follow`|Continue to follow logs after deployment has ended *(deprecated, use `--exit-on never` instead)*|
|`-f`, `--force`|Force deploy even if it's not fast-forwardable|
|`-q`, `--quiet`|Don't show logs during deployment|
|`-p`, `--same-commit-policy` `<policy>`|What to do when local and remote commit are identical (error, ignore, restart, rebuild) (default: error)|
|`-t`, `--tag` `<tag>`|Tag to push (none by default)|
