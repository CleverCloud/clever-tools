# 📖 `clever ssh-keys` command reference

## ➡️ `clever ssh-keys`

Manage SSH keys of the current user

```bash
clever ssh-keys [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever ssh-keys add`

Add a new SSH key to the current user

```bash
clever ssh-keys add [OPTIONS] <SSH-KEY-PATH> <SSH-KEY-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `ssh-key-path` | SSH public key path (.pub) |
| `ssh-key-name` | SSH key name |

## ➡️ `clever ssh-keys open`

Open the SSH keys management page in the Console

```bash
clever ssh-keys open [OPTIONS]
```

## ➡️ `clever ssh-keys remove`

Remove a SSH key from the current user

```bash
clever ssh-keys remove [OPTIONS] <SSH-KEY-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `ssh-key-name` | SSH key name |

## ➡️ `clever ssh-keys remove-all`

Remove all SSH keys from the current user

```bash
clever ssh-keys remove-all [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-y`, `--yes` | Skip confirmation and remove all SSH keys directly |
