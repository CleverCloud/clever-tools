import type {
  KubernetesClusterItemStatus,
  KubernetesClusterItemType,
  KubernetesClusterLoadBalancer,
  KubernetesClusterNodeGroupSummary,
  KubernetesClusterStandaloneNodeGroupSummary,
  KubernetesClusterStatus,
  KubernetesDeploymentOperation,
  KubernetesDeploymentStepName,
  KubernetesFlavor,
  KubernetesNodeGroupStatus,
  KubernetesNodeStatus,
  KubernetesQuotaItem,
  KubernetesTopologyConfig,
} from '@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js';

/**
 * A Kubernetes cluster as the API returns it, which is what `clever k8s get` and `clever k8s list`
 * printed with `--format json` before the `@clevercloud/client` migration.
 */
export interface LegacyKubernetesCluster {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  tags: Array<string>;
  status: KubernetesClusterStatus;
  creationDate: string;
  version: string;
  topologyConfig: KubernetesTopologyConfig;
  locationId: string;
  features?: LegacyKubernetesClusterFeatures;
  nodeGroups: Array<KubernetesClusterNodeGroupSummary>;
  standaloneNodeGroups: Array<KubernetesClusterStandaloneNodeGroupSummary>;
  loadBalancers: Array<KubernetesClusterLoadBalancer>;
  storageUsageBytes: number | null;
}

/** The optional capabilities of a cluster, named as the API names them. */
export interface LegacyKubernetesClusterFeatures {
  csi: unknown | null;
  registries: unknown | null;
  autoscalingEnabled: boolean | null;
}

/**
 * A node group as the API returns it, which is what `clever k8s nodegroups get` and
 * `clever k8s nodegroups list` printed with `--format json` before the migration.
 */
export interface LegacyKubernetesNodeGroup {
  id: string;
  clusterId: string;
  name: string;
  description: string | null;
  tag: string | null;
  flavor: KubernetesFlavor;
  currentNodeCount: number;
  targetNodeCount: number;
  minNodeCount: number;
  maxNodeCount: number;
  taints: Array<LegacyKubernetesTaint>;
  labels: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
  status: KubernetesNodeGroupStatus;
  autoscalingEnabled: boolean;
}

/** A taint as the API returns it: a taint carrying no value is sent as `"value": null`. */
export interface LegacyKubernetesTaint {
  key: string;
  value: string | null;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

/** A quota as the API returns it, which is what `clever k8s quota --format json` printed. */
export interface LegacyKubernetesQuota {
  id: string;
  tenantId: string;
  tags: Array<string>;
  quotas: Array<KubernetesQuotaItem>;
}

/**
 * The version check of a cluster as the API returns it, which is what `clever k8s version` and
 * `clever k8s version check` printed with `--format json` before the migration.
 */
export interface LegacyKubernetesClusterVersionCheck {
  available: Array<string>;
  installed: string;
  latest: string;
  needUpdate: boolean;
}

/**
 * One entry of a cluster's event log as the API returns it, which is what
 * `clever k8s activity --format json` printed before the migration.
 */
export type LegacyKubernetesClusterEvent =
  | LegacyKubernetesClusterStatusEvent
  | LegacyKubernetesClusterItemEvent
  | LegacyKubernetesNodeLifecycleEvent;

/** A cluster-level status transition, as the API returns it. */
export interface LegacyKubernetesClusterStatusEvent {
  event: 'CLUSTER_STATUS';
  date: string;
  status: KubernetesClusterStatus;
  failure: LegacyKubernetesClusterDeploymentFailure | null;
}

/** A change to one infrastructure resource backing a cluster, as the API returns it. */
export interface LegacyKubernetesClusterItemEvent {
  event: 'CLUSTER_ITEM';
  date: string;
  id: string;
  itemType: KubernetesClusterItemType;
  status: KubernetesClusterItemStatus;
  data?: Record<string, unknown>;
}

/** A node-level lifecycle signal, as the API returns it. */
export interface LegacyKubernetesNodeLifecycleEvent {
  event: 'NODE_LIFECYCLE';
  date: string;
  status: KubernetesNodeStatus;
  nodeId: string;
  nodeName: string;
  nodeGroupId: string;
  flavor: KubernetesFlavor;
  failure: LegacyKubernetesClusterDeploymentFailure | null;
}

/** Why a deployment operation failed, as the API returns it. */
export interface LegacyKubernetesClusterDeploymentFailure {
  operation: KubernetesDeploymentOperation;
  step?: KubernetesDeploymentStepName;
  message: string;
  occurredAt: string;
}
