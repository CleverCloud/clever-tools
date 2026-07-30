import { AddKubernetesPersistentStorageCommand } from '@clevercloud/client/cc-api-commands/kubernetes/add-kubernetes-persistent-storage-command.js';
import { CheckKubernetesClusterVersionCommand } from '@clevercloud/client/cc-api-commands/kubernetes/check-kubernetes-cluster-version-command.js';
import { CreateKubernetesClusterCommand } from '@clevercloud/client/cc-api-commands/kubernetes/create-kubernetes-cluster-command.js';
import { CreateKubernetesNodeGroupCommand } from '@clevercloud/client/cc-api-commands/kubernetes/create-kubernetes-node-group-command.js';
import { DeleteKubernetesClusterCommand } from '@clevercloud/client/cc-api-commands/kubernetes/delete-kubernetes-cluster-command.js';
import { DeleteKubernetesNodeGroupCommand } from '@clevercloud/client/cc-api-commands/kubernetes/delete-kubernetes-node-group-command.js';
import { GetKubernetesClusterCommand } from '@clevercloud/client/cc-api-commands/kubernetes/get-kubernetes-cluster-command.js';
import { GetKubernetesKubeconfigCommand } from '@clevercloud/client/cc-api-commands/kubernetes/get-kubernetes-kubeconfig-command.js';
import { GetKubernetesNodeGroupCommand } from '@clevercloud/client/cc-api-commands/kubernetes/get-kubernetes-node-group-command.js';
import { GetKubernetesProductCommand } from '@clevercloud/client/cc-api-commands/kubernetes/get-kubernetes-product-command.js';
import { GetKubernetesQuotaCommand } from '@clevercloud/client/cc-api-commands/kubernetes/get-kubernetes-quota-command.js';
import { ListKubernetesClusterCommand } from '@clevercloud/client/cc-api-commands/kubernetes/list-kubernetes-cluster-command.js';
import { ListKubernetesClusterEventCommand } from '@clevercloud/client/cc-api-commands/kubernetes/list-kubernetes-cluster-event-command.js';
import { ListKubernetesNodeGroupCommand } from '@clevercloud/client/cc-api-commands/kubernetes/list-kubernetes-node-group-command.js';
import { ListKubernetesUsageCommand } from '@clevercloud/client/cc-api-commands/kubernetes/list-kubernetes-usage-command.js';
import { UpdateKubernetesClusterCommand } from '@clevercloud/client/cc-api-commands/kubernetes/update-kubernetes-cluster-command.js';
import { UpdateKubernetesClusterVersionCommand } from '@clevercloud/client/cc-api-commands/kubernetes/update-kubernetes-cluster-version-command.js';
import { UpdateKubernetesNodeGroupCommand } from '@clevercloud/client/cc-api-commands/kubernetes/update-kubernetes-node-group-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import dedent from 'dedent';
import { toLegacyKubernetesClusterVersionCheck } from '../legacy-json/kubernetes.legacy.js';
import { Logger } from '../logger.js';
import { clients } from '../models/cc-api-client.js';
import { getOwnerIdFromOrgIdOrName } from '../models/ids-resolver.js';
import { ask, confirm, selectAnswer } from './prompts.js';
import { styleText } from './style-text.js';

/**
 * Check if a Kubernetes cluster status is ACTIVE
 * @param {string} orgIdOrName The organisation ID or name
 * @param {string} clusterIdOrName The cluster ID or name
 * @returns {Promise<boolean>} True if the cluster is deployed, false otherwise
 */
export async function isK8sClusterActive(orgIdOrName, clusterIdOrName) {
  const cluster = await getK8sCluster(orgIdOrName, clusterIdOrName);

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
    const available = product.versions?.availableVersions ?? [];
    if (!available.includes(options.version)) {
      throw new Error(`Version "${options.version}" is not available. Supported: ${available.join(', ')}`);
    }
    body.version = options.version;
  }
  if (options.description != null) body.description = options.description;
  if (options.tags?.length) body.tags = options.tags;

  const features = {};
  if (options.autoscaling) features.isAutoscalingEnabled = true;
  if (options.persistentStorage) features.isCsi = true;
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

  return clients.ccApi.send(new CreateKubernetesClusterCommand({ ownerId, ...body }));
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
  return clients.ccApi.send(new GetKubernetesProductCommand());
}

/**
 * List all kubernetes addons
 * @param {string} [orgIdOrName] The organisation ID or name
 * @returns {Promise<Array<import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesCluster>>} The list of non-deleted clusters
 */
export async function k8sList(orgIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const deployed = await clients.ccApi.send(new ListKubernetesClusterCommand({ ownerId }));

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

  const cluster = await tolerateNotFound(clients.ccApi.send(new GetKubernetesClusterCommand({ ownerId, clusterId })));

  if (cluster == null) {
    throw new Error(`No Kubernetes cluster found with the ID ${styleText('red', clusterId)}`);
  }

  return cluster;
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

  return clients.ccApi.send(new GetKubernetesKubeconfigCommand({ ownerId, clusterId }));
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

  return clients.ccApi.send(new UpdateKubernetesClusterCommand({ ownerId, clusterId, ...updates }));
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

  return clients.ccApi.send(new DeleteKubernetesClusterCommand({ ownerId, clusterId }));
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
    const matches = await clients.ccApi
      .send(new ListKubernetesClusterCommand({ ownerId }))
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

  return clients.ccApi.send(new AddKubernetesPersistentStorageCommand({ ownerId, clusterId }));
}

/**
 * Get the Kubernetes quota of an organisation
 * @param {object} [orgIdOrName] The organisation ID or name
 * @returns {Promise<object>} The quota payload (id, ownerId, tags, quotas)
 */
export async function k8sGetQuota(orgIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);

  return clients.ccApi.send(new GetKubernetesQuotaCommand({ ownerId }));
}

/**
 * List the current Kubernetes usage items of an organisation
 * @param {object} [orgIdOrName] The organisation ID or name
 * @returns {Promise<object[]>} The list of cluster usage items
 */
export async function k8sListUsage(orgIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);

  return clients.ccApi.send(new ListKubernetesUsageCommand({ ownerId }));
}

/**
 * List the event log of a Kubernetes cluster
 * @param {object} orgIdOrName The organisation ID or name
 * @param {string|object} clusterIdOrName The cluster ID or name
 * @param {number} [limit] Max number of events to return
 * @returns {Promise<Array<import('@clevercloud/client/cc-api-commands/kubernetes/kubernetes.types.js').KubernetesClusterEvent>>}
 */
export async function k8sListActivity(orgIdOrName, clusterIdOrName, limit) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);

  return clients.ccApi.send(new ListKubernetesClusterEventCommand({ ownerId, clusterId, limit }));
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

  return clients.ccApi.send(new ListKubernetesNodeGroupCommand({ ownerId, clusterId }));
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
    body.isAutoscalingEnabled = true;
    body.minNodeCount = options.min;
    body.maxNodeCount = options.max;
  }

  return clients.ccApi.send(new CreateKubernetesNodeGroupCommand({ ownerId, clusterId, ...body }));
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
 * @param {object} updates Patch fields (targetNodeCount, minNodeCount, maxNodeCount, isAutoscalingEnabled, description, tag)
 * @returns {Promise<object>}
 */
export async function k8sUpdateNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName, updates) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);
  const clusterId = await getClusterIdFromAddonIdOrName(clusterIdOrName, ownerId);
  const nodeGroupId = await resolveNodeGroupId(ownerId, clusterId, nodeGroupIdOrName);
  const current = await getNodeGroup(ownerId, clusterId, nodeGroupId);

  // `name` and `targetNodeCount` are required by the API on every PATCH call
  const body = { name: current.name, targetNodeCount: current.targetNodeCount, ...updates };

  return clients.ccApi.send(new UpdateKubernetesNodeGroupCommand({ ownerId, clusterId, nodeGroupId, ...body }));
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

  return clients.ccApi.send(new DeleteKubernetesNodeGroupCommand({ ownerId, clusterId, nodeGroupId }));
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

  return getNodeGroup(ownerId, clusterId, nodeGroupId);
}

/**
 * Get a node group by its ID
 * @param {string} ownerId
 * @param {string} clusterId
 * @param {string} nodeGroupId
 * @returns {Promise<object>}
 * @throws {Error} If the node group is not found
 */
async function getNodeGroup(ownerId, clusterId, nodeGroupId) {
  const nodeGroup = await tolerateNotFound(
    clients.ccApi.send(new GetKubernetesNodeGroupCommand({ ownerId, clusterId, nodeGroupId })),
  );

  if (nodeGroup == null) {
    throw new Error(`No node group found with the ID ${styleText('red', nodeGroupId)}`);
  }

  return nodeGroup;
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
  const list = await clients.ccApi.send(new ListKubernetesNodeGroupCommand({ ownerId, clusterId }));
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
  const versions = await clients.ccApi.send(new CheckKubernetesClusterVersionCommand({ ownerId, clusterId }));

  switch (format) {
    case 'json':
      // `--format json` still prints the raw payload, see src/legacy-json/README.md
      Logger.printJson(toLegacyKubernetesClusterVersionCheck(versions));
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

        await clients.ccApi.send(
          new UpdateKubernetesClusterVersionCommand({ ownerId, clusterId, targetVersion: versions.latest }),
        );
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
  const versions = await clients.ccApi.send(new CheckKubernetesClusterVersionCommand({ ownerId, clusterId }));

  const targetVersion =
    askedVersion ??
    (await selectAnswer(
      `Which version do you want to update ${styleText('blue', name)} to, current is ${styleText('blue', versions.installed)}?`,
      [...versions.availableVersions].reverse(),
      'Use --target <version> to update directly.',
    ));

  if (!versions.availableVersions.includes(targetVersion)) {
    throw new Error(`Version ${styleText('red', targetVersion)} is not available`);
  }

  if (versions.installed === targetVersion) {
    Logger.printSuccess(`${styleText('green', name)} is already at version ${styleText('green', targetVersion)}`);
    return;
  }

  await clients.ccApi.send(new UpdateKubernetesClusterVersionCommand({ ownerId, clusterId, targetVersion }));
  Logger.printSuccess(`${styleText('green', name)} is upgrading to ${styleText('green', targetVersion)}…`);
}

function getClusterDisplayName(clusterIdOrName, fallbackId) {
  if (typeof clusterIdOrName === 'object') {
    return clusterIdOrName.addon_name ?? clusterIdOrName.operator_id ?? fallbackId;
  }
  return clusterIdOrName ?? fallbackId;
}
