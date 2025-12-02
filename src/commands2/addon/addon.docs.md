# 📖 `clever addon` command reference

## ➡️ `clever addon`

Manage add-ons

```bash
clever addon [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon create`

Create an add-on

```bash
clever addon create [FLAGS] <ADDON-PROVIDER> <ADDON-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-provider` | Add-on provider **(required)** |
| `addon-name` | Add-on name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-l`, `--link` `<alias>` | Link the created add-on to the app with the specified alias |
| `-y`, `--yes` | Skip confirmation even if the add-on is not free |
| `-p`, `--plan` `<plan>` | Add-on plan, depends on the provider |
| `-r`, `--region` `<region>` | Region to provision the add-on in, depends on the provider (default: `par`) |
| `--addon-version` `<addon-version>` | The version to use for the add-on |
| `--option` `<option>` | Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon delete`

Delete an add-on

```bash
clever addon delete [FLAGS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-y`, `--yes` | Skip confirmation and delete the add-on directly |

## ➡️ `clever addon env`

List environment variables for an add-on

```bash
clever addon env [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon list`

List available add-ons

```bash
clever addon list [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon providers`

List available add-on providers

```bash
clever addon providers [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon providers show`

Show information about an add-on provider

```bash
clever addon providers show [FLAGS] <ADDON-PROVIDER>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-provider` | Add-on provider **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon rename`

Rename an add-on

```bash
clever addon rename [FLAGS] <ADDON-NAME> <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-name` | Add-on name **(required)** |
| `addon-id` | Add-on ID (or name, if unambiguous) **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
