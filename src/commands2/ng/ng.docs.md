# 📖 `clever ng` command reference

## ➡️ `clever ng`

List Network Groups

```bash
clever ng [FLAGS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng create`

Create a Network Group

```bash
clever ng create [FLAGS] <NG-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `ng-label` | Network Group label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--link` `<members_ids>` | Comma separated list of members IDs to link to a Network Group (app\_xxx, external\_xxx, mysql\_xxx, postgresql\_xxx, redis\_xxx, etc.) |
| `--description` `<description>` | Network Group description |
| `--tags` `<tags>` | List of tags, separated by a comma |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng create external`

Create an external peer in a Network Group

```bash
clever ng create external [FLAGS] <EXTERNAL-PEER-LABEL> <PUBLIC-KEY> <NG-ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `external-peer-label` | External peer label **(required)** |
| `public-key` | WireGuard public key of the external peer to link to a Network Group **(required)** |
| `ng-id-or-label` | Network Group ID or label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng delete`

Delete a Network Group

```bash
clever ng delete [FLAGS] <NG-ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `ng-id-or-label` | Network Group ID or label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng delete external`

Delete an external peer from a Network Group

```bash
clever ng delete external [FLAGS] <EXTERNAL-PEER-ID-OR-LABEL> <NG-ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `external-peer-id-or-label` | External peer ID or label **(required)** |
| `ng-id-or-label` | Network Group ID or label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng get`

Get details about a Network Group, a member or a peer

```bash
clever ng get [FLAGS] <ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-label` | ID or Label of a Network Group, a member or an (external) peer **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--type` `<type>` | Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer) |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng get-config`

Get the WireGuard configuration of a peer in a Network Group

```bash
clever ng get-config [FLAGS] <EXTERNAL-PEER-ID-OR-LABEL> <NG-ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `external-peer-id-or-label` | External peer ID or label **(required)** |
| `ng-id-or-label` | Network Group ID or label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng link`

Link a resource by its ID (app\_xxx, external\_xxx, mysql\_xxx, postgresql\_xxx, redis\_xxx, etc.) to a Network Group

```bash
clever ng link [FLAGS] <ID> <NG-ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id` | ID of a resource to (un)link to a Network Group **(required)** |
| `ng-id-or-label` | Network Group ID or label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever ng search`

Search Network Groups, members or peers and get their details

```bash
clever ng search [FLAGS] <ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-label` | ID or Label of a Network Group, a member or an (external) peer **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--type` `<type>` | Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer) |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ng unlink`

Unlink a resource by its ID (app\_xxx, external\_xxx, mysql\_xxx, postgresql\_xxx, redis\_xxx, etc.) from a Network Group

```bash
clever ng unlink [FLAGS] <ID> <NG-ID-OR-LABEL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id` | ID of a resource to (un)link to a Network Group **(required)** |
| `ng-id-or-label` | Network Group ID or label **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
