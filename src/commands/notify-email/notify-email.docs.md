# 📖 `clever notify-email` command reference

## ➡️ `clever notify-email` <kbd>Since 0.6.1</kbd>

Manage email notifications

```bash
clever notify-email [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--list-all`|List all notifications for your user or for an organisation with the '--org' option|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever notify-email add` <kbd>Since 0.6.1</kbd>

Add a new email notification

```bash
clever notify-email add --notify <email-address|user-id|organisation> <name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`name`|Notification name|

### ⚙️ Options

|Name|Description|
|---|---|
|`--notify` `<email-address\|user-id\|organisation>`|Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated) **(required)**|
|`--event` `<event-type>`|Restrict notifications to specific event types|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--service` `<service-id>`|Restrict notifications to specific applications and add-ons|

## ➡️ `clever notify-email remove` <kbd>Since 0.6.1</kbd>

Remove an existing email notification

```bash
clever notify-email remove <notification-id> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`notification-id`|Notification ID|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
