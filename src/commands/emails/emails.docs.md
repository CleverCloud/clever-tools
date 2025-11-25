# 📖 `clever emails` command reference

## ➡️ `clever emails`

Manage email addresses of the current user

```bash
clever emails [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever emails add`

Add a new secondary email address to the current user

```bash
clever emails add [OPTIONS] <EMAIL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `email` | Email address |

## ➡️ `clever emails open`

Open the email addresses management page in the Console

```bash
clever emails open [OPTIONS]
```

## ➡️ `clever emails primary`

Set the primary email address of the current user

```bash
clever emails primary [OPTIONS] <EMAIL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `email` | Email address |

## ➡️ `clever emails remove`

Remove a secondary email address from the current user

```bash
clever emails remove [OPTIONS] <EMAIL>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `email` | Email address |

## ➡️ `clever emails remove-all`

Remove all secondary email addresses from the current user

```bash
clever emails remove-all [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-y`, `--yes` | Skip confirmation |
