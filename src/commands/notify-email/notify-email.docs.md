# 📖 `clever notify-email` command reference

## ➡️ `clever notify-email`

Manage email notifications

```bash
clever notify-email [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever notify-email add`

Add a new email notification

```bash
clever notify-email add [OPTIONS] <NAME> --notify <<EMAIL_ADDRESS>|<USER_ID>|"ORGANISATION">
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `name` | Notification name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--notify` `<<email_address>|<user_id>|"organisation">` | Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated) |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `--event` `<type>` | Restrict notifications to specific event types |
| `--service` `<service_id>` | Restrict notifications to specific applications and add-ons |

## ➡️ `clever notify-email remove`

Remove an existing email notification

```bash
clever notify-email remove [OPTIONS] <NOTIFICATION-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `notification-id` | Notification ID |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
