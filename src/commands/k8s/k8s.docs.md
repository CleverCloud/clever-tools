# 📖 `clever k8s` command reference

## ➡️ `clever k8s`

Manage Kubernetes clusters

```bash
clever k8s [OPTIONS]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

## ➡️ `clever k8s add-persistent-storage`

Activate persistent storage to a deployed Kubernetes cluster

```bash
clever k8s add-persistent-storage [OPTIONS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s create`

Create a Kubernetes cluster

```bash
clever k8s create [OPTIONS] <CLUSTER-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `cluster-name` | Kubernetes cluster name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-w`, `--watch` | Watch the deployment until the cluster is deployed |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s delete`

Delete a Kubernetes cluster

```bash
clever k8s delete [OPTIONS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-y`, `--yes` | Skip confirmation and delete the add-on directly |

## ➡️ `clever k8s get`

Get information about a Kubernetes cluster

```bash
clever k8s get [OPTIONS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |

## ➡️ `clever k8s get-kubeconfig`

Get configuration of a Kubernetes cluster

```bash
clever k8s get-kubeconfig [OPTIONS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s list`

List Kubernetes clusters

```bash
clever k8s list [OPTIONS]
```

### 🚩 Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) |
