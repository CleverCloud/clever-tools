# 📖 `clever webhooks` command reference

## ➡️ `clever webhooks`

Manage webhooks

```bash
clever webhooks [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever webhooks add`

Register webhook to be called when events happen

```bash
clever webhooks add [OPTIONS] <URL> <NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `url` | Webhook URL |
| `name` | Notification name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--format` `<format>` | Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `--list-all` | List all notifications for your user or for an organisation with the '--org' option |
| `--event` `<type>` | Restrict notifications to specific event types |
| `--service` `<service_id>` | Restrict notifications to specific applications and add-ons |

## ➡️ `clever webhooks remove`

Remove an existing webhook

```bash
clever webhooks remove [OPTIONS] <NOTIFICATION-ID>
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
