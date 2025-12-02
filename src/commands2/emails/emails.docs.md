# 📖 `clever emails` command reference

## ➡️ `clever emails`

Manage email addresses of the current user

```bash
clever emails [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever emails add`

Add a new secondary email address to the current user

```bash
clever emails add <EMAIL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `email` | Email address **(required)** |

## ➡️ `clever emails open`

Open the email addresses management page in the Console

```bash
clever emails open
```

## ➡️ `clever emails primary`

Set the primary email address of the current user

```bash
clever emails primary <EMAIL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `email` | Email address **(required)** |

## ➡️ `clever emails remove`

Remove a secondary email address from the current user

```bash
clever emails remove <EMAIL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `email` | Email address **(required)** |

## ➡️ `clever emails remove-all`

Remove all secondary email addresses from the current user

```bash
clever emails remove-all [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-y`, `--yes` | Skip confirmation |
