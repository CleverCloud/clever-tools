import dedent from 'dedent';
import { ask, confirm, selectAnswer } from './prompts.js';
import { styleText } from './style-text.js';

import {
  addK8sPersistentStorage,
  createK8sCluster,
  createK8sNodeGroup,
  deleteK8sCluster,
  deleteK8sNodeGroup,
  getK8sAddon,
  getK8sConfig,
  getK8sNodeGroup,
  getK8sProduct,
  getK8sQuota,
  getK8sVersionCheck,
  listK8sClusters,
  listK8sDeploymentEvents,
  listK8sNodeGroups,
  listK8sUsage,
  updateK8sCluster,
  updateK8sNodeGroup,
  updateK8sVersion,
} from '../clever-client/k8s.js';
import { Logger } from '../logger.js';
import { getOwnerIdFromOrgIdOrName } from '../models/ids-resolver.js';
import { sendToApi } from '../models/send-to-api.js';

/**
 * Check if a Kubernetes cluster status is ACTIVE
 * @param {string} orgIdOrName The organisation ID or name
 * @param {string} clusterIdOrName The cluster ID or name
 * @returns {Promise<boolean>} True if the cluster is deployed, false otherwise
 */
export async function isK8sClusterActive(orgIdOrName, clusterIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const cluster = await getK8sAddon({ ownerId, clusterId }).then(sendToApi);

  return cluster.status === 'ACTIVE';
}

/**
 * Create a kubernetes cluster
 * @param {string} name The name of the cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {object} [options]
 * @param {string} [options.version] The Kubernetes version to deploy
 * @param {string} [options.description] A free-form description
 * @param {string[]} [options.tags] Semantic tags ("tag" or "key:value")
 * @param {boolean} [options.autoscaling] Enable the cluster autoscaler
 * @param {boolean} [options.persistentStorage] Enable the Ceph CSI persistent storage
 * @param {string} [options.topology] Topology kind (ALL_IN_ONE, DEDICATED_COMPUTE, DISTRIBUTED)
 * @param {string} [options.flavor] Control plane flavor
 * @param {number} [options.replicationFactor] Control plane replication factor
 * @param {{flavor: string, targetNodeCount: number}} [options.nodeGroup] Initial node group
 * @returns {Promise<object>}
 */
export async function k8sCreate(name, orgIdOrName, options = {}) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const product = await k8sGetProduct();

  const body = { name };
  if (options.version != null) {
    const available = product.versions?.available ?? [];
    if (!available.includes(options.version)) {
      throw new Error(`Version "${options.version}" is not available. Supported: ${available.join(', ')}`);
    }
    body.version = options.version;
  }
  if (options.description != null) body.description = options.description;
  if (options.tags?.length) body.tags = options.tags;

  const features = {};
  if (options.autoscaling) features.autoscalingEnabled = true;
  if (options.persistentStorage) features.csi = true;
  if (Object.keys(features).length > 0) body.features = features;

  body.topologyConfig = resolveTopologyConfig(options, product);

  if (options.nodeGroup != null) {
    const supported = getNodeGroupFlavors(product);
    if (!supported.includes(options.nodeGroup.flavor)) {
      throw new Error(
        `Flavor "${options.nodeGroup.flavor}" is not a valid node group flavor. Supported: ${supported.join(', ')}`,
      );
    }
    let addNodeGroup = true;
    if (body.topologyConfig.topology === 'ALL_IN_ONE' && !options.yes) {
      Logger.println(
        styleText(
          'yellow',
          '⚠️  ALL_IN_ONE topology already schedules pods on control plane VMs — an additional node group is usually unnecessary.',
        ),
      );
      addNodeGroup = await ask('Add the node group anyway?', false);
      if (!addNodeGroup) {
        Logger.println('Node group creation skipped, cluster will be deployed without it');
      }
    }
    if (addNodeGroup) {
      body.nodeGroups = [
        { name: 'default', flavor: options.nodeGroup.flavor, targetNodeCount: options.nodeGroup.targetNodeCount },
      ];
    }
  }

  return createK8sCluster({ ownerId }, body).then(sendToApi);
}

const FLAVOR_ORDER = ['2XS', 'XS', 'S', 'M', 'L', 'XL'];
const DEFAULT_TOPOLOGY = 'ALL_IN_ONE';
const DISTRIBUTED_COMPONENTS = [
  'apiserver',
  'controllerManager',
  'scheduler',
  'nodeGroupOperator',
  'cloudControllerManager',
];

function resolveTopologyConfig({ topology, flavor, replicationFactor }, product) {
  const resolvedTopology = topology ?? DEFAULT_TOPOLOGY;
  const constraint = product.topologies?.find((t) => t.topology === resolvedTopology);
  if (constraint == null) {
    const supported = (product.topologies ?? []).map((t) => t.topology).join(', ');
    throw new Error(`Unknown topology "${resolvedTopology}". Supported: ${supported}`);
  }

  const resolvedFlavor = flavor ?? FLAVOR_ORDER.find((f) => constraint.availableFlavors?.includes(f));
  if (resolvedFlavor == null || !constraint.availableFlavors?.includes(resolvedFlavor)) {
    throw new Error(
      `Flavor "${resolvedFlavor}" is not available for ${resolvedTopology}. Supported: ${(constraint.availableFlavors ?? []).join(', ')}`,
    );
  }

  const { min, max } = constraint.replicationFactor;
  const resolvedRf = replicationFactor ?? min;
  if (resolvedRf < min || resolvedRf > max) {
    throw new Error(`Replication factor for ${resolvedTopology} must be between ${min} and ${max}`);
  }

  if (resolvedTopology === 'DISTRIBUTED') {
    const component = { flavor: resolvedFlavor, replicationFactor: resolvedRf };
    return {
      topology: 'DISTRIBUTED',
      components: Object.fromEntries(DISTRIBUTED_COMPONENTS.map((c) => [c, component])),
    };
  }

  return { topology: resolvedTopology, flavor: resolvedFlavor, replicationFactor: resolvedRf };
}

/**
 * Get the Kubernetes service configuration (supported topologies, flavors, versions)
 * @returns {Promise<object>}
 */
export async function k8sGetProduct() {
  return getK8sProduct().then(sendToApi);
}

/**
 * List all kubernetes addons
 * @param {string} format The output format
 * @returns {Promise<void>}
 */
export async function k8sList(orgIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const deployed = await listK8sClusters({ ownerId }).then(sendToApi);

  return deployed.filter((op) => op.status != 'DELETED');
}

/**
 * Get information about a kubernetes cluster
 * @param {string} orgIdOrName The organisation ID or name
 * @param {string} clusterIdOrName The cluster ID or name
 * @returns {Promise<object>} The kubernetes cluster information
 */
export async function getK8sCluster(orgIdOrName, clusterIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return getK8sAddon({ ownerId, clusterId }).then(sendToApi);
}

/**
 * Get Kubernetes cluster configuration
 * @param {string} orgIdOrName The organisation ID or name
 * @param {string} clusterIdOrName The cluster ID or name
 * @returns {Promise<string>} The kubeconfig.yaml content
 */
export async function k8sGetConfig(orgIdOrName, clusterIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return getK8sConfig({ ownerId, clusterId }).then(sendToApi);
}

/**
 * Update a Kubernetes cluster metadata or features
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {object} updates Patch fields (name, description, tags, features)
 * @returns {Promise<object>}
 */
export async function k8sUpdate(orgIdOrName, clusterIdOrName, updates) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return updateK8sCluster({ ownerId, clusterId }, updates).then(sendToApi);
}

/**
 * Delete a kubernetes cluster
 * @param {string} orgIdOrName The organisation ID or name
 * @param {string} clusterIdOrName The cluster ID or name
 * @returns {Promise<void>}
 */
export async function k8sDelete(orgIdOrName, clusterIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return deleteK8sCluster({ ownerId, clusterId }).then(sendToApi);
}

/**
 * Get Kubernetes cluster ID from an addon ID or name
 * @param {string|object} addonIdOrName The addon ID or name
 * @param {string} ownerId The owner ID
 * @returns {Promise<string>} The Kubernetes cluster ID
 */
export async function getClusterIdFromAddonIdOrName(addonIdOrName, ownerId) {
  if (typeof addonIdOrName === 'string') {
    return addonIdOrName;
  } else if (typeof addonIdOrName === 'object' && addonIdOrName.operator_id) {
    return addonIdOrName.operator_id;
  } else if (typeof addonIdOrName === 'object' && addonIdOrName.addon_name) {
    const name = addonIdOrName.addon_name;
    const matches = await listK8sClusters({ ownerId })
      .then(sendToApi)
      .then((clusters) => clusters.filter((c) => c.name === name && c.status !== 'DELETED'));

    if (matches.length === 0) {
      throw new Error(`No Kubernetes cluster found with the name ${styleText('red', name)}`);
    }
    if (matches.length > 1) {
      const listing = matches.map((c) => `- ${c.name} (${c.id})`).join('\n');
      throw new Error(
        `Multiple Kubernetes clusters found with the name ${styleText('red', name)}, use the ID instead:\n${styleText('grey', listing)}`,
      );
    }
    return matches[0].id;
  } else {
    throw new Error('Invalid Kubernetes Cluster identifier provided');
  }
}

/**
 * Add persistent storage to a deployed Kubernetes cluster
 * @param {string} orgIdOrName The organisation ID or name
 * @param {string} clusterIdOrName The cluster ID or name
 * @returns {Promise<void>}
 */
export async function k8sAddPersistentStorage(orgIdOrName, clusterIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return addK8sPersistentStorage({ ownerId, clusterId }).then(sendToApi);
}

/**
 * Get the Kubernetes quota of an organisation
 * @param {object} [orgIdOrName] The organisation ID or name
 * @returns {Promise<object>} The quota payload (id, tenantId, tags, quotas)
 */
export async function k8sGetQuota(orgIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);

  return getK8sQuota({ ownerId }).then(sendToApi);
}

/**
 * List the current Kubernetes usage items of an organisation
 * @param {object} [orgIdOrName] The organisation ID or name
 * @returns {Promise<object[]>} The list of cluster usage items
 */
export async function k8sListUsage(orgIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);

  return listK8sUsage({ ownerId }).then(sendToApi);
}

/**
 * List deployment events for a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {number} [limit] Max number of events to return
 * @returns {Promise<object[]>}
 */
export async function k8sListActivity(orgIdOrName, clusterIdOrName, limit) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const queryParams = limit != null ? { limit } : {};

  return listK8sDeploymentEvents({ ownerId, clusterId }, queryParams).then(sendToApi);
}

/**
 * List the node groups of a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @returns {Promise<object[]>}
 */
export async function k8sListNodeGroups(orgIdOrName, clusterIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return listK8sNodeGroups({ ownerId, clusterId }).then(sendToApi);
}

/**
 * Create a node group on a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {object} options
 * @param {string} options.name Node group name
 * @param {string} options.flavor Node flavor (2XS..XL)
 * @param {number} options.targetNodeCount Target node count
 * @param {string} [options.description]
 * @param {string} [options.tag]
 * @param {boolean} [options.autoscaling]
 * @param {number} [options.min] Minimum node count (autoscaling)
 * @param {number} [options.max] Maximum node count (autoscaling)
 * @returns {Promise<object>}
 */
export async function k8sCreateNodeGroup(orgIdOrName, clusterIdOrName, options) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const product = await k8sGetProduct();

  const supported = getNodeGroupFlavors(product);
  if (!supported.includes(options.flavor)) {
    throw new Error(`Flavor "${options.flavor}" is not a valid node group flavor. Supported: ${supported.join(', ')}`);
  }

  const wantsAutoscaling = options.autoscaling || options.min != null || options.max != null;
  if (wantsAutoscaling && (options.min == null || options.max == null)) {
    throw new Error('--autoscaling requires both --min and --max');
  }
  if (wantsAutoscaling && options.min > options.max) {
    throw new Error('--min must be less than or equal to --max');
  }

  const body = { name: options.name, flavor: options.flavor, targetNodeCount: options.targetNodeCount };
  if (options.description != null) body.description = options.description;
  if (options.tag != null) body.tag = options.tag;
  if (wantsAutoscaling) {
    body.autoscalingEnabled = true;
    body.minNodeCount = options.min;
    body.maxNodeCount = options.max;
  }

  return createK8sNodeGroup({ ownerId, clusterId }, body).then(sendToApi);
}

function getNodeGroupFlavors(product) {
  const available = new Set((product.topologies ?? []).flatMap((t) => t.availableFlavors ?? []));
  return FLAVOR_ORDER.filter((f) => available.has(f));
}

/**
 * Update a node group on a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {string} nodeGroupIdOrName The node group ID or name
 * @param {object} updates Patch fields (targetNodeCount, minNodeCount, maxNodeCount, autoscalingEnabled, description, tag)
 * @returns {Promise<object>}
 */
export async function k8sUpdateNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName, updates) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const nodeGroupId = await resolveNodeGroupId(ownerId, clusterId, nodeGroupIdOrName);
  const current = await getK8sNodeGroup({ ownerId, clusterId, nodeGroupId }).then(sendToApi);

  const body = { name: current.name, targetNodeCount: current.targetNodeCount, ...updates };

  return updateK8sNodeGroup({ ownerId, clusterId, nodeGroupId }, body).then(sendToApi);
}

/**
 * Delete a node group from a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {string} nodeGroupIdOrName The node group ID or name
 * @returns {Promise<void>}
 */
export async function k8sDeleteNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const nodeGroupId = await resolveNodeGroupId(ownerId, clusterId, nodeGroupIdOrName);

  return deleteK8sNodeGroup({ ownerId, clusterId, nodeGroupId }).then(sendToApi);
}

/**
 * Get a specific node group of a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {string} nodeGroupIdOrName The node group ID or name
 * @returns {Promise<object>}
 */
export async function k8sGetNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const nodeGroupId = await resolveNodeGroupId(ownerId, clusterId, nodeGroupIdOrName);

  return getK8sNodeGroup({ ownerId, clusterId, nodeGroupId }).then(sendToApi);
}

const NODE_GROUP_ID_REGEX = /^node_group_[0-9A-HJ-NP-TV-Z]{26}$/i;

/**
 * Resolve a node group ID from either an ID or a name (scoped to a cluster)
 * @param {string} ownerId
 * @param {string} clusterId
 * @param {string} nodeGroupIdOrName
 * @returns {Promise<string>}
 */
async function resolveNodeGroupId(ownerId, clusterId, nodeGroupIdOrName) {
  if (NODE_GROUP_ID_REGEX.test(nodeGroupIdOrName)) {
    return nodeGroupIdOrName;
  }
  const list = await listK8sNodeGroups({ ownerId, clusterId }).then(sendToApi);
  const matches = list.filter((ng) => ng.name === nodeGroupIdOrName);
  if (matches.length === 0) {
    throw new Error(`No node group found with name ${styleText('red', nodeGroupIdOrName)}`);
  }
  if (matches.length > 1) {
    const listing = matches.map((ng) => `- ${ng.name} (${ng.id})`).join('\n');
    throw new Error(
      `Multiple node groups found with the name ${styleText('red', nodeGroupIdOrName)}, use the ID instead:\n${styleText('grey', listing)}`,
    );
  }
  return matches[0].id;
}

/**
 * Check a Kubernetes cluster version against available upgrades
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {string} format The output format
 * @returns {Promise<void>}
 */
export async function k8sCheckVersion(orgIdOrName, clusterIdOrName, format) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const name = getClusterDisplayName(clusterIdOrName, clusterId);
  const versions = await getK8sVersionCheck({ ownerId, clusterId }).then(sendToApi);

  switch (format) {
    case 'json':
      Logger.printJson(versions);
      break;
    case 'human':
    default:
      if (!versions.needUpdate) {
        Logger.printSuccess(`${styleText('green', name)} is up-to-date (${styleText('green', versions.installed)})`);
      } else {
        Logger.println(dedent`
          🔄 ${styleText('red', name)} is outdated
             • Installed version: ${styleText('red', versions.installed)}
             • Latest version: ${styleText('green', versions.latest)}
        `);
        Logger.println();

        await confirm(
          `Do you want to update it to ${styleText('green', versions.latest)} now?`,
          'No confirmation, aborting version update',
        );

        await updateK8sVersion({ ownerId, clusterId }, { targetVersion: versions.latest }).then(sendToApi);
        Logger.printSuccess(`${styleText('green', name)} is upgrading to ${styleText('green', versions.latest)}…`);
      }
      break;
  }
}

/**
 * Update a Kubernetes cluster version
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {string} [askedVersion] The target version; prompts from available versions when omitted
 * @returns {Promise<void>}
 */
export async function k8sUpdateVersion(orgIdOrName, clusterIdOrName, askedVersion) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const name = getClusterDisplayName(clusterIdOrName, clusterId);
  const versions = await getK8sVersionCheck({ ownerId, clusterId }).then(sendToApi);

  const targetVersion =
    askedVersion ??
    (await selectAnswer(
      `Which version do you want to update ${styleText('blue', name)} to, current is ${styleText('blue', versions.installed)}?`,
      [...versions.available].reverse(),
    ));

  if (!versions.available.includes(targetVersion)) {
    throw new Error(`Version ${styleText('red', targetVersion)} is not available`);
  }

  if (versions.installed === targetVersion) {
    Logger.printSuccess(`${styleText('green', name)} is already at version ${styleText('green', targetVersion)}`);
    return;
  }

  await updateK8sVersion({ ownerId, clusterId }, { targetVersion }).then(sendToApi);
  Logger.printSuccess(`${styleText('green', name)} is upgrading to ${styleText('green', targetVersion)}…`);
}

function getClusterDisplayName(clusterIdOrName, fallbackId) {
  if (typeof clusterIdOrName === 'object') {
    return clusterIdOrName.addon_name ?? clusterIdOrName.operator_id ?? fallbackId;
  }
  return clusterIdOrName ?? fallbackId;
}
