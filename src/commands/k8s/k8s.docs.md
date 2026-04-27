# 📖 `clever k8s` command reference

> [!NOTE]
> 🧪 **Experimental**: This command may change or be removed in future versions.
> Enable with: `clever features enable k8s`

## ➡️ `clever k8s` <kbd>Since 4.3.0</kbd>

Manage Kubernetes clusters

```bash
clever k8s
```

## ➡️ `clever k8s activity` <kbd>Since unreleased</kbd>

Show recent deployment events of a Kubernetes cluster

```bash
clever k8s activity <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--limit` `<limit>`|Number of events to fetch (1 to 1000) (default: 50)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

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
|`--cluster-version` `<cluster-version>`|Kubernetes version to deploy (e.g.: 1.36)|
|`--description` `<description>`|Free-form cluster description|
|`--flavor` `<flavor>`|Control plane flavor|
|`--nodegroup` `<flavor:count>`|Initial node group (format: <flavor>:<count>, e.g.: XS:3)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--persistent-storage`|Enable persistent storage (Ceph CSI)|
|`--replication-factor` `<replication-factor>`|Control plane replication factor|
|`--tag` `<tag[,tag...]>`|Semantic tags (comma-separated, e.g.: env:prod,team:platform)|
|`--topology` `<topology>`|Cluster topology (must be set with --flavor and --replication-factor)|
|`-w`, `--watch`|Watch the deployment until the cluster is deployed|
|`-y`, `--yes`|Skip confirmation prompts|

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
|`-y`, `--yes`|Skip confirmation prompts|

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

## ➡️ `clever k8s quota` <kbd>Since unreleased</kbd>

Get the Kubernetes quota, usage and remaining of an organisation

```bash
clever k8s quota [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|

## ➡️ `clever k8s update` <kbd>Since unreleased</kbd>

Update a Kubernetes cluster metadata or features

```bash
clever k8s update <cluster-id|cluster-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`cluster-id|cluster-name`|Kubernetes cluster ID or name|

### ⚙️ Options

|Name|Description|
|---|---|
|`--autoscaling`|Enable the cluster autoscaler|
|`--description` `<description>`|Free-form cluster description|
|`--disable-autoscaling`|Disable the cluster autoscaler|
|`--name` `<name>`|Rename the cluster|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`--tag` `<tag[,tag...]>`|Replace tags (comma-separated, e.g.: env:prod,team:platform)|
