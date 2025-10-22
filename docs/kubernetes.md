# Clever Kubernetes

Clever Cloud allows you to create and manage Kubernetes clusters directly from Clever Tools. Once created and configured, you can use them with `kubectl` or any Kubernetes-compatible tool.

- [Learn more about Kubernetes on Clever Cloud](https://www.clever-cloud.com/doc/kubernetes/)

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
