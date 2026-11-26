import { USER_SELF } from './user.ts';

/**
 * Kubernetes cluster as returned by `GET /v4/kubernetes/organisations/:ownerId/clusters/:clusterId`.
 * No real cluster was available to check it: its shape follows the raw payload read by `transformKubernetesCluster()`
 * in `@clevercloud/client` (`cc-api-commands/kubernetes`).
 */
export interface RawKubernetesCluster {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  tags: Array<string>;
  status: string;
  creationDate: string;
  version: string;
  topologyConfig: { topology: string; replicationFactor: number; flavor: string };
  locationId: string;
  features: { csi: boolean | null; registries: string | null; autoscalingEnabled: boolean | null } | null;
  nodeGroups: Array<unknown>;
  standaloneNodeGroups: Array<unknown>;
  loadBalancers: Array<unknown>;
  storageUsageBytes: number | null;
}

export const KUBERNETES_CLUSTER = {
  id: 'kubernetes_00000000-0000-4000-8000-000000000700',
  tenantId: USER_SELF.id,
  name: 'my-cluster',
  description: null,
  tags: ['env:prod', 'team:platform'],
  status: 'ACTIVE',
  creationDate: '2026-01-01T00:00:00Z',
  version: '1.34',
  topologyConfig: { topology: 'ALL_IN_ONE', replicationFactor: 1, flavor: 'M' },
  locationId: 'par',
  features: { csi: false, registries: null, autoscalingEnabled: false },
  nodeGroups: [],
  standaloneNodeGroups: [],
  loadBalancers: [],
  storageUsageBytes: null,
} satisfies RawKubernetesCluster;
