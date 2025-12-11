# 📖 `clever addon` command reference

## ➡️ `clever addon` <kbd>Since 0.2.3</kbd>

Manage add-ons

```bash
clever addon [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon create` <kbd>Since 0.2.3</kbd>

Create an add-on

```bash
clever addon create <addon-provider> <addon-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-provider` | Add-on provider |
| `addon-name` | Add-on name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-l`, `--link` `<alias>` | Link the created add-on to the app with the specified alias |
| `-y`, `--yes` | Skip confirmation even if the add-on is not free |
| `-p`, `--plan` `<plan>` | Add-on plan, depends on the provider |
| `-r`, `--region` `<region>` | Region to provision the add-on in, depends on the provider (default: `par`) |
| `--addon-version` `<addon-version>` | The version to use for the add-on |
| `--option` `<option>` | Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon delete` <kbd>Since 0.2.3</kbd>

Delete an add-on

```bash
clever addon delete <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-y`, `--yes` | Skip confirmation and delete the add-on directly |

## ➡️ `clever addon env` <kbd>Since 2.11.0</kbd>

List environment variables for an add-on

```bash
clever addon env [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon list` <kbd>Since 0.2.3</kbd>

List available add-ons

```bash
clever addon list [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon providers` <kbd>Since 0.2.3</kbd>

List available add-on providers

```bash
clever addon providers [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon providers show` <kbd>Since 0.2.3</kbd>

Show information about an add-on provider

```bash
clever addon providers show <addon-provider> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-provider` | Add-on provider |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever addon rename` <kbd>Since 0.3.0</kbd>

Rename an add-on

```bash
clever addon rename <addon-name> <addon-id> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `addon-name` | Add-on name |
| `addon-id` | Add-on ID (or name, if unambiguous) |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
