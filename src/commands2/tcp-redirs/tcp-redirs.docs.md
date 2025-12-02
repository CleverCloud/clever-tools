# 📖 `clever tcp-redirs` command reference

## ➡️ `clever tcp-redirs`

Control the TCP redirections from reverse proxies to your application

```bash
clever tcp-redirs [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever tcp-redirs add`

Add a new TCP redirection to the application

```bash
clever tcp-redirs add [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--namespace` `<namespace>` | Namespace in which the TCP redirection should be **(required)** |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever tcp-redirs list-namespaces`

List the namespaces in which you can create new TCP redirections

```bash
clever tcp-redirs list-namespaces [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever tcp-redirs remove`

Remove a TCP redirection from the application

```bash
clever tcp-redirs remove [FLAGS] <PORT>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `port` | port identifying the TCP redirection **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--namespace` `<namespace>` | Namespace in which the TCP redirection should be **(required)** |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
