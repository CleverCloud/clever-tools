# 📖 `clever notify-email` command reference

## ➡️ `clever notify-email`

Manage email notifications

```bash
clever notify-email [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever notify-email add`

Add a new email notification

```bash
clever notify-email add [FLAGS] <NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `name` | Notification name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--notify` `<<email_address>|<user_id>|"organisation">` | Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated) **(required)** |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `--event` `<type>` | Restrict notifications to specific event types |
| `--service` `<service_id>` | Restrict notifications to specific applications and add-ons |

## ➡️ `clever notify-email remove`

Remove an existing email notification

```bash
clever notify-email remove [FLAGS] <NOTIFICATION-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `notification-id` | Notification ID **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
