# 📖 `clever members` command reference

## ➡️ `clever members` <kbd>Unreleased</kbd>

Manage the members of an organisation

```bash
clever members
```

## ➡️ `clever members invite` <kbd>Unreleased</kbd>

Invite someone to an organisation

```bash
clever members invite --role <role> <org-id|org-name> <email> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|
|`email`|Email address of the person to invite|

### ⚙️ Options

|Name|Description|
|---|---|
|`--role` `<role>`|Role of the new member (admin, manager, developer, accounting) **(required)**|

## ➡️ `clever members list` <kbd>Unreleased</kbd>

List the members of an organisation

```bash
clever members list <org-id|org-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--role` `<role>`|Only list the members with this role (admin, manager, developer, accounting)|
|`--without-2fa`|Only list the members without 2FA|
