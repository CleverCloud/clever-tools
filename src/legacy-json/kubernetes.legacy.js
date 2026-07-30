// Dates are the one thing these functions do not put back: the client normalizes every date it
// returns (`normalizeDate`, which accepts epoch milliseconds, `Date` objects and the
// `2026-01-01T00:00:00Z[UTC]` form Java services emit), so whatever the Kubernetes API serialized
// them as, only the resulting ISO string reaches the CLI. `--format json` keeps that ISO string.

/**
 * Inverse of `transformKubernetesCluster` in
 * `@clevercloud/client/cc-api-commands/kubernetes/kubernetes-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesCluster} cluster
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesCluster}
 */
export function toLegacyKubernetesCluster(cluster) {
  return {
    id: cluster.id,
    tenantId: cluster.ownerId,
    name: cluster.name,
    // the transform turns the API's `null` into an absent key
    description: cluster.description ?? null,
    tags: cluster.tags,
    status: cluster.status,
    creationDate: cluster.createdAt,
    version: cluster.version,
    topologyConfig: cluster.topologyConfig,
    locationId: cluster.locationId,
    features: toLegacyKubernetesClusterFeatures(cluster.features),
    nodeGroups: cluster.nodeGroups,
    standaloneNodeGroups: cluster.standaloneNodeGroups,
    loadBalancers: cluster.loadBalancers,
    storageUsageBytes: cluster.storageUsageBytes ?? null,
  };
}

/**
 * Inverse of `transformKubernetesClusterFeatures` in
 * `@clevercloud/client/cc-api-commands/kubernetes/kubernetes-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesClusterFeatures} [features]
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesClusterFeatures | undefined}
 */
function toLegacyKubernetesClusterFeatures(features) {
  if (features == null) {
    return undefined;
  }

  return {
    csi: features.isCsi ?? null,
    registries: features.registries ?? null,
    autoscalingEnabled: features.isAutoscalingEnabled ?? null,
  };
}

/**
 * Inverse of `transformKubernetesNodeGroup` in
 * `@clevercloud/client/cc-api-commands/kubernetes/kubernetes-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesNodeGroup} nodeGroup
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesNodeGroup}
 */
export function toLegacyKubernetesNodeGroup(nodeGroup) {
  return {
    id: nodeGroup.id,
    clusterId: nodeGroup.clusterId,
    name: nodeGroup.name,
    // the transform turns the API's `null` into an absent key
    description: nodeGroup.description ?? null,
    tag: nodeGroup.tag ?? null,
    flavor: nodeGroup.flavor,
    currentNodeCount: nodeGroup.currentNodeCount,
    targetNodeCount: nodeGroup.targetNodeCount,
    minNodeCount: nodeGroup.minNodeCount,
    maxNodeCount: nodeGroup.maxNodeCount,
    taints: nodeGroup.taints?.map(toLegacyKubernetesTaint),
    labels: nodeGroup.labels,
    createdAt: nodeGroup.createdAt,
    updatedAt: nodeGroup.updatedAt,
    status: nodeGroup.status,
    autoscalingEnabled: nodeGroup.isAutoscalingEnabled,
  };
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesTaint} taint
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesTaint}
 */
function toLegacyKubernetesTaint(taint) {
  return {
    key: taint.key,
    // the transform turns the API's `null` into an absent key
    value: taint.value ?? null,
    effect: taint.effect,
  };
}

/**
 * Inverse of `transformKubernetesQuota` in
 * `@clevercloud/client/cc-api-commands/kubernetes/kubernetes-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesQuota} quota
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesQuota}
 */
export function toLegacyKubernetesQuota(quota) {
  return {
    id: quota.id,
    tenantId: quota.ownerId,
    tags: quota.tags,
    quotas: quota.quotas,
  };
}

/**
 * Inverse of `transformKubernetesClusterVersionCheck` in
 * `@clevercloud/client/cc-api-commands/kubernetes/kubernetes-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesClusterVersionCheck} versionCheck
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesClusterVersionCheck}
 */
export function toLegacyKubernetesClusterVersionCheck(versionCheck) {
  return {
    available: versionCheck.availableVersions,
    installed: versionCheck.installed,
    latest: versionCheck.latest,
    needUpdate: versionCheck.needUpdate,
  };
}

/**
 * Inverse of `transformKubernetesClusterEvent` in
 * `@clevercloud/client/cc-api-commands/kubernetes/kubernetes-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesClusterEvent} event
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesClusterEvent}
 */
export function toLegacyKubernetesClusterEvent(event) {
  switch (event.event) {
    case 'CLUSTER_STATUS':
      return {
        event: 'CLUSTER_STATUS',
        date: event.date,
        status: event.status,
        failure: toLegacyKubernetesClusterDeploymentFailure(event.failure),
      };
    case 'CLUSTER_ITEM':
      return {
        event: 'CLUSTER_ITEM',
        date: event.date,
        id: event.id,
        itemType: event.itemType,
        status: event.status,
        ...(event.data == null ? {} : { data: toLegacyKubernetesClusterItemData(event.data) }),
      };
    case 'NODE_LIFECYCLE':
      return {
        event: 'NODE_LIFECYCLE',
        date: event.date,
        status: event.status,
        nodeId: event.nodeId,
        nodeName: event.nodeName,
        nodeGroupId: event.nodeGroupId,
        flavor: event.flavor,
        failure: toLegacyKubernetesClusterDeploymentFailure(event.failure),
      };
  }
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesClusterDeploymentFailure} [failure]
 * @returns {import('./kubernetes.legacy.types.js').LegacyKubernetesClusterDeploymentFailure | null}
 */
function toLegacyKubernetesClusterDeploymentFailure(failure) {
  if (failure == null) {
    return null;
  }

  return {
    operation: failure.operation,
    step: failure.step,
    message: failure.message,
    occurredAt: failure.occurredAt,
  };
}

/**
 * Inverse of `transformKubernetesClusterItemData`: the owner key is `orgId` on the Materia variant
 * and `tenantId` on the others, and the variants that carry neither are passed through.
 *
 * @param {import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesClusterItemData} data
 * @returns {Record<string, unknown>}
 */
function toLegacyKubernetesClusterItemData(data) {
  if (data.type === 'PublicMateriaLogicalDBData') {
    const { ownerId, ...rest } = data;
    return { ...rest, orgId: ownerId };
  }

  if (data.type === 'PublicControlPlaneBundleData') {
    return {
      ...data,
      // an API server bound to no public port is sent as `"port": null`, which the transform drops
      components: data.components?.map((component) =>
        component.type === 'PublicApiServer' ? { ...component, port: component.port ?? null } : component,
      ),
    };
  }

  if ('ownerId' in data) {
    const { ownerId, ...rest } = data;
    return { ...rest, tenantId: ownerId };
  }

  return { ...data };
}
