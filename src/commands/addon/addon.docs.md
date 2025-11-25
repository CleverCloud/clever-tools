# 📖 `clever addon` command reference

## ➡️ `clever addon`

Manage add-ons

```bash
clever addon [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever addon create`

Create an add-on

```bash
clever addon create [OPTIONS] <ADDON-PROVIDER> <ADDON-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-provider` | Add-on provider |
| `addon-name` | Add-on name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-l`, `--link` `<alias>` | Link the created add-on to the app with the specified alias |
| `-y`, `--yes` | Skip confirmation even if the add-on is not free |
| `-p`, `--plan` `<plan>` | Add-on plan, depends on the provider |
| `-r`, `--region` `<region>` | Region to provision the add-on in, depends on the provider |
| `--addon-version` `<addon-version>` | The version to use for the add-on |
| `--option` `<option>` | Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever addon delete`

Delete an add-on

```bash
clever addon delete [OPTIONS] <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-y`, `--yes` | Skip confirmation and delete the add-on directly |

## ➡️ `clever addon env`

List environment variables for an add-on

```bash
clever addon env [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever addon list`

List available add-ons

```bash
clever addon list [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever addon providers`

List available add-on providers

```bash
clever addon providers [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever addon providers show`

Show information about an add-on provider

```bash
clever addon providers show [OPTIONS] <ADDON-PROVIDER>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-provider` | Add-on provider |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever addon rename`

Rename an add-on

```bash
clever addon rename [OPTIONS] <ADDON-NAME> <ADDON-ID>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `addon-name` | Add-on name |
| `addon-id` | Add-on ID (or name, if unambiguous) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
