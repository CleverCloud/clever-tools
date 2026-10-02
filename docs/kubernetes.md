# Clever Kubernetes

Clever Cloud allows you to create and manage Kubernetes clusters directly from Clever Tools. Once created and configured, you can use them with `kubectl` or any Kubernetes-compatible tool.

- [Learn more about Kubernetes on Clever Cloud](https://www.clever.cloud/doc/kubernetes/)

## Prerequisites

Activate `k8s` feature flag to manage Kubernetes clusters:

```
clever features enable k8s
```

Then, check it works with the following command:

```
clever k8s
```

In all the following examples, you can target a specific organisation with the `--org` or `-o` option.

## Create/Delete a Cluster

To create a Kubernetes cluster, you just need a name and you can wait for it to be in `ACTIVE` state:
```
clever k8s create myKubeCluster
clever k8s delete myKubeCluster --watch
```

To delete a cluster, use:
```
clever k8s delete myKubeCluster
clever k8s delete myKubeCluster --yes
```

## List Clusters

If you have cluster, you can list them and know their name, ID and status with:

```
clever k8s list
clever k8s list --format json
```

## Get Cluster information

To get information about a specific cluster, use:

```
clever k8s get myKubeCluster
clever k8s get kubernetes_id -F json
```

Classic response is a table:

```
┌─────────┬─────────────────────────────────────────┐
│ (index) │ Values                                  │
├─────────┼─────────────────────────────────────────┤
│ Name    │ 'myKubeCluster'                         │
│ ID      │ 'kubernetes_id'                         │
│ Version │ 1.34.1                                  │
│ Status  │ 'ACTIVE'                                │
└─────────┴─────────────────────────────────────────┘
```

## Enable node auto-provisioning

Instead of sizing node groups yourself, you can let the cluster autoscale its nodes: node auto-provisioning creates and deletes nodes to fit the pods waiting to be scheduled. It's powered by [Karpenter](https://karpenter.sh), installed in the cluster by Clever Cloud. Enable it at creation time, or later on an `ACTIVE` cluster:

```
clever k8s create myKubeCluster --node-autoprovisioning
clever k8s update myKubeCluster --node-autoprovisioning
```

Karpenter provisions nothing until you create your own `NodePool` and `CleverNodeClass` resources in the cluster.

A cluster is reported with the features it has installed, not with the ones it was asked for. Right after an activation, `clever k8s get` shows `disabled (cluster reconciling)` while the cluster is `RECONCILING`, then `enabled` once Karpenter is in place. A deactivation reads the same way in reverse: `enabled (cluster reconciling)`, then `disabled`.

To disable it, which really uninstalls Karpenter:

```
clever k8s update myKubeCluster --disable-node-autoprovisioning
```

Delete your `NodePool`, `NodeOverlay` and `CleverNodeClass` resources and let Karpenter drain the nodes first, otherwise the command is refused.

Node auto-provisioning can't run alongside the node group autoscaler. If it is enabled on an existing cluster, disable it before enabling node auto-provisioning:

```
clever k8s update myKubeCluster --disable-autoscaling
```

The existing `--autoscaling`, `--disable-autoscaling`, `--min` and `--max` options remain available for managing the node group autoscaler. `--autoscaling` and `--node-autoprovisioning` cannot be enabled together.

## Add persistent storage to a Cluster

You can add persistent storage to an `ACTIVE` cluster with:

```
clever k8s add-persistent-storage myKubeCluster
```

Once added you can't remove it, but you can start a fresh cluster without persistent storage.

## Get kubeconfig file of a Cluster

To get the `kubeconfig` file of an `ACTIVE` cluster, and set it as the current context, use:

```
clever k8s get-kubeconfig myKubeCluster
clever k8s get-kubeconfig myKubeCluster > ~/.kube/config
```
