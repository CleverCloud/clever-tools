# 📖 `clever k8s` command reference

## ➡️ `clever k8s` <kbd>Since 4.3.0</kbd>

Manage Kubernetes clusters

```bash
clever k8s
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

## ➡️ `clever k8s add-persistent-storage` <kbd>Since 4.3.0</kbd>

Activate persistent storage to a deployed Kubernetes cluster

```bash
clever k8s add-persistent-storage <cluster-id|cluster-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `cluster-id\|cluster-name` | Kubernetes cluster ID or name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s create` <kbd>Since 4.3.0</kbd>

Create a Kubernetes cluster

```bash
clever k8s create <cluster-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `cluster-name` | Kubernetes cluster name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-w`, `--watch` | Watch the deployment until the cluster is deployed |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s delete` <kbd>Since 4.3.0</kbd>

Delete a Kubernetes cluster

```bash
clever k8s delete <cluster-id|cluster-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `cluster-id\|cluster-name` | Kubernetes cluster ID or name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-y`, `--yes` | Skip confirmation and delete the add-on directly |

## ➡️ `clever k8s get` <kbd>Since 4.3.0</kbd>

Get information about a Kubernetes cluster

```bash
clever k8s get <cluster-id|cluster-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `cluster-id\|cluster-name` | Kubernetes cluster ID or name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever k8s get-kubeconfig` <kbd>Since 4.3.0</kbd>

Get configuration of a Kubernetes cluster

```bash
clever k8s get-kubeconfig <cluster-id|cluster-name> [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `cluster-id\|cluster-name` | Kubernetes cluster ID or name |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s list` <kbd>Since 4.3.0</kbd>

List Kubernetes clusters

```bash
clever k8s list [options]
```

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
