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

## ➡️ `clever tags add` <kbd>Unreleased</kbd>

Add a tag to a resource (and to the FS bucket add-on of an SFTP application)

```bash
clever tags add <resource-id> <tag>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`resource-id`|Resource ID: application (app_xxx), add-on (addon_xxx or real ID), Kubernetes cluster or Network Group|
|`tag`|Tag|

## ➡️ `clever tags remove` <kbd>Unreleased</kbd>

Remove a tag from a resource (and from the FS bucket add-on of an SFTP application)

```bash
clever tags remove <resource-id> <tag>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`resource-id`|Resource ID: application (app_xxx), add-on (addon_xxx or real ID), Kubernetes cluster or Network Group|
|`tag`|Tag|

## ➡️ `clever tags remove-all` <kbd>Unreleased</kbd>

Remove all the tags of a resource (and of the FS bucket add-on of an SFTP application)

```bash
clever tags remove-all <resource-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`resource-id`|Resource ID: application (app_xxx), add-on (addon_xxx or real ID), Kubernetes cluster or Network Group|

### ⚙️ Options

|Name|Description|
|---|---|
|`-y`, `--yes`|Skip confirmation prompts|
