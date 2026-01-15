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

### 🧪 Experimental: Native Git backend

By default, Clever Tools uses a built-in JavaScript git implementation (`isomorphic-git`) for git operations. This works out of the box without requiring git to be installed, but has some limitations:

* **Slow performance** on repositories with rewritten history (rebases, squashes)
* **Connection timeouts** on large repositories or when pushing big files, due to HTTP-based transfers
* **HTTP-only**: cannot use SSH-based git protocols

If you experience these issues, you can enable the **native git backend** which uses the `git` command installed on your system. It requires git to be available in your PATH.

```bash
clever features enable native-git
```

To disable and return to the built-in implementation:

```bash
clever features disable native-git
```
