# 📖 `clever tags` command reference

> [!NOTE]
> 🧪 **Experimental**: This command may change or be removed in future versions.
> Enable with: `clever features enable tags`

## ➡️ `clever tags` <kbd>Unreleased</kbd>

Manage the tags of applications, add-ons, Kubernetes clusters and Network Groups

```bash
clever tags
```

## ➡️ `clever tags list` <kbd>Unreleased</kbd>

List the tags of a resource

```bash
clever tags list <resource-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`resource-id`|Resource ID: application (app_xxx), add-on (addon_xxx or real ID), Kubernetes cluster or Network Group|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
