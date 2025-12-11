# 📖 `clever webhooks` command reference

## ➡️ `clever webhooks` <kbd>Since 0.6.0</kbd>

Manage webhooks

```bash
clever webhooks [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever webhooks add` <kbd>Since 0.6.0</kbd>

Register webhook to be called when events happen

```bash
clever webhooks add <url> <name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `url` | Webhook URL |
| `name` | Notification name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--format` `<format>` | Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') (default: `raw`) |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `--event` `<event-type>` | Restrict notifications to specific event types |
| `--service` `<service-id>` | Restrict notifications to specific applications and add-ons |

## ➡️ `clever webhooks remove` <kbd>Since 0.6.0</kbd>

Remove an existing webhook

```bash
clever webhooks remove <notification-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `notification-id` | Notification ID |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
