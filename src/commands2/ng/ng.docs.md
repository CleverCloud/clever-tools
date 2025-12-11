# 📖 `clever ng` command reference

## ➡️ `clever ng` <kbd>Since 3.12.0</kbd>

List Network Groups

```bash
clever ng [options]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng create` <kbd>Since 3.12.0</kbd>

Create a Network Group

```bash
clever ng create <ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `ng-label` | Network Group label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--link` `<members-ids>` | Comma separated list of members IDs to link to a Network Group (app\_xxx, external\_xxx, mysql\_xxx, postgresql\_xxx, redis\_xxx, etc.) |
| `--description` `<description>` | Network Group description |
| `--tags` `<tags>` | List of tags, separated by a comma |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng create external` <kbd>Since 3.12.0</kbd>

Create an external peer in a Network Group

```bash
clever ng create external <external-peer-label> <public-key> <ng-id|ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `external-peer-label` | External peer label |
| `public-key` | WireGuard public key of the external peer to link to a Network Group |
| `ng-id\|ng-label` | Network Group ID or label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng delete` <kbd>Since 3.12.0</kbd>

Delete a Network Group

```bash
clever ng delete <ng-id|ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `ng-id\|ng-label` | Network Group ID or label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng delete external` <kbd>Since 3.12.0</kbd>

Delete an external peer from a Network Group

```bash
clever ng delete external <peer-id|peer-label> <ng-id|ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `peer-id\|peer-label` | External peer ID or label |
| `ng-id\|ng-label` | Network Group ID or label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng get` <kbd>Since 3.12.0</kbd>

Get details about a Network Group, a member or a peer

```bash
clever ng get <id|label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `id\|label` | ID or Label of a Network Group, a member or an (external) peer |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--type` `<resource-type>` | Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer) |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng get-config` <kbd>Since 3.12.0</kbd>

Get the WireGuard configuration of a peer in a Network Group

```bash
clever ng get-config <peer-id|peer-label> <ng-id|ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `peer-id\|peer-label` | External peer ID or label |
| `ng-id\|ng-label` | Network Group ID or label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng link` <kbd>Since 3.12.0</kbd>

Link a resource by its ID (app\_xxx, external\_xxx, mysql\_xxx, postgresql\_xxx, redis\_xxx, etc.) to a Network Group

```bash
clever ng link <id> <ng-id|ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `id` | ID of a resource to (un)link to a Network Group |
| `ng-id\|ng-label` | Network Group ID or label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng search` <kbd>Since 3.12.0</kbd>

Search Network Groups, members or peers and get their details

```bash
clever ng search <id|label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `id\|label` | ID or Label of a Network Group, a member or an (external) peer |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `--type` `<resource-type>` | Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer) |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng unlink` <kbd>Since 3.12.0</kbd>

Unlink a resource by its ID (app\_xxx, external\_xxx, mysql\_xxx, postgresql\_xxx, redis\_xxx, etc.) from a Network Group

```bash
clever ng unlink <id> <ng-id|ng-label> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `id` | ID of a resource to (un)link to a Network Group |
| `ng-id\|ng-label` | Network Group ID or label |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
