# 📖 `clever k8s` command reference

## ➡️ `clever k8s`

Manage Kubernetes clusters

```bash
clever k8s
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

## ➡️ `clever k8s add-persistent-storage`

Activate persistent storage to a deployed Kubernetes cluster

```bash
clever k8s add-persistent-storage [FLAGS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s create`

Create a Kubernetes cluster

```bash
clever k8s create [FLAGS] <CLUSTER-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `cluster-name` | Kubernetes cluster name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-w`, `--watch` | Watch the deployment until the cluster is deployed |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s delete`

Delete a Kubernetes cluster

```bash
clever k8s delete [FLAGS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-y`, `--yes` | Skip confirmation and delete the add-on directly |

## ➡️ `clever k8s get`

Get information about a Kubernetes cluster

```bash
clever k8s get [FLAGS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |

## ➡️ `clever k8s get-kubeconfig`

Get configuration of a Kubernetes cluster

```bash
clever k8s get-kubeconfig [FLAGS] <ID-OR-NAME>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `id-or-name` | Kubernetes cluster ID or name **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |

## ➡️ `clever k8s list`

List Kubernetes clusters

```bash
clever k8s list [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
