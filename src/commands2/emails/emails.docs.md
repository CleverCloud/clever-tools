# 📖 `clever emails` command reference

## ➡️ `clever emails` <kbd>Since 3.13.0</kbd>

Manage email addresses of the current user

```bash
clever emails [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever emails add` <kbd>Since 3.13.0</kbd>

Add a new secondary email address to the current user

```bash
clever emails add <email>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`email`|Email address|

## ➡️ `clever emails open` <kbd>Since 3.13.0</kbd>

Open the email addresses management page in the Console

```bash
clever emails open
```

## ➡️ `clever emails primary` <kbd>Since 3.13.0</kbd>

Set the primary email address of the current user

```bash
clever emails primary <email>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`email`|Email address|

## ➡️ `clever emails remove` <kbd>Since 3.13.0</kbd>

Remove a secondary email address from the current user

```bash
clever emails remove <email>
```

### 📥 Arguments

|Name|Description|
|---|---|
|`email`|Email address|

## ➡️ `clever emails remove-all` <kbd>Since 3.13.0</kbd>

Remove all secondary email addresses from the current user

```bash
clever emails remove-all [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-y`, `--yes`|Skip confirmation|
