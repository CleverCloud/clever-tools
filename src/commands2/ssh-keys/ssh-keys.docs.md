# 📖 `clever ssh-keys` command reference

## ➡️ `clever ssh-keys`

Manage SSH keys of the current user

```bash
clever ssh-keys [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever ssh-keys add`

Add a new SSH key to the current user

```bash
clever ssh-keys add <SSH-KEY-PATH> <SSH-KEY-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `ssh-key-path` | SSH public key path (.pub) **(required)** |
| `ssh-key-name` | SSH key name **(required)** |

## ➡️ `clever ssh-keys open`

Open the SSH keys management page in the Console

```bash
clever ssh-keys open
```

## ➡️ `clever ssh-keys remove`

Remove a SSH key from the current user

```bash
clever ssh-keys remove <SSH-KEY-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `ssh-key-name` | SSH key name **(required)** |

## ➡️ `clever ssh-keys remove-all`

Remove all SSH keys from the current user

```bash
clever ssh-keys remove-all [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-y`, `--yes` | Skip confirmation and remove all SSH keys directly |
