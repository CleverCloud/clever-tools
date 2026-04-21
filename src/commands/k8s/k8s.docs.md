# 📖 `clever k8s` command reference

> [!NOTE]
> 🧪 **Experimental**: This command may change or be removed in future versions.
> Enable with: `clever features enable k8s`

## ➡️ `clever k8s` <kbd>Since 4.3.0</kbd>

Manage Kubernetes clusters

```bash
clever k8s
```

## ➡️ `clever k8s add-persistent-storage` <kbd>Since 4.3.0</kbd>

Activate persistent storage to a deployed Kubernetes cluster

```bash
clever k8s add-persistent-storage <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s create` <kbd>Since 4.3.0</kbd>

Create a Kubernetes cluster

```bash
clever k8s create <cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-name`|Kubernetes cluster name|

### ⚙️ Options

|Name|Description|
|---|---|
|`--autoscaling`|Enable the cluster autoscaler|
|`--cluster-version` `<cluster-version>`|Kubernetes version to deploy (e.g.: 1.33)|
|`--description` `<description>`|Free-form cluster description|
|`--flavor` `<flavor>`|Control plane flavor|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--persistent-storage`|Enable persistent storage (Ceph CSI)|
|`--replication-factor` `<replication-factor>`|Control plane replication factor|
|`--tag` `<tag[,tag...]>`|Semantic tags (comma-separated, e.g.: env:prod,team:platform)|
|`--topology` `<topology>`|Cluster topology (must be set with --flavor and --replication-factor)|
|`-w`, `--watch`|Watch the deployment until the cluster is deployed|

## ➡️ `clever k8s delete` <kbd>Since 4.3.0</kbd>

Delete a Kubernetes cluster

```bash
clever k8s delete <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`-y`, `--yes`|Skip confirmation and proceed with deletion directly|

## ➡️ `clever k8s get` <kbd>Since 4.3.0</kbd>

Get information about a Kubernetes cluster

```bash
clever k8s get <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s get-kubeconfig` <kbd>Since 4.3.0</kbd>

Get configuration of a Kubernetes cluster

```bash
clever k8s get-kubeconfig <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s list` <kbd>Since 4.3.0</kbd>

List Kubernetes clusters

```bash
clever k8s list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s quota` <kbd>Since 4.9.0</kbd>

Get the Kubernetes quota, usage and remaining of an organisation

```bash
clever k8s quota [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s version` <kbd>Since 4.9.0</kbd>

Check a Kubernetes cluster deployed version

```bash
clever k8s version <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s version check` <kbd>Since 4.9.0</kbd>

Check a Kubernetes cluster deployed version

```bash
clever k8s version check <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s version update` <kbd>Since 4.9.0</kbd>

Update a Kubernetes cluster to a target version

```bash
clever k8s version update <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--target` `<version>`|Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)|
