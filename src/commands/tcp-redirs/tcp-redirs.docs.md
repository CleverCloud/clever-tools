# 📖 `clever tcp-redirs` command reference

## ➡️ `clever tcp-redirs`

Control the TCP redirections from reverse proxies to your application

```bash
clever tcp-redirs [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever tcp-redirs add`

Add a new TCP redirection to the application

```bash
clever tcp-redirs add [OPTIONS] --namespace <NAMESPACE>
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `--namespace` `<namespace>` | Namespace in which the TCP redirection should be |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |

## ➡️ `clever tcp-redirs list-namespaces`

List the namespaces in which you can create new TCP redirections

```bash
clever tcp-redirs list-namespaces [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever tcp-redirs remove`

Remove a TCP redirection from the application

```bash
clever tcp-redirs remove [OPTIONS] <PORT> --namespace <NAMESPACE>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `port` | port identifying the TCP redirection |

### 🚩 Options

| Name | Description |
|------|-------------|
| `--namespace` `<namespace>` | Namespace in which the TCP redirection should be |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
