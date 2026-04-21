import dedent from 'dedent';
import { confirm, selectAnswer } from './prompts.js';
import { styleText } from './style-text.js';

import {
  addK8sPersistentStorage,
  createK8sCluster,
  deleteK8sCluster,
  getK8sAddon,
  getK8sConfig,
  getK8sProduct,
  getK8sQuota,
  getK8sVersionCheck,
  listK8sClusters,
  listK8sUsage,
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
 * @param {string} [options.topology] Topology kind (ALL_IN_ONE or DEDICATED_COMPUTE)
 * @param {string} [options.flavor] Control plane flavor
 * @param {number} [options.replicationFactor] Control plane replication factor (1 to 5)
 * @returns {Promise<object>}
 */
export async function k8sCreate(name, orgIdOrName, options = {}) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgIdOrName);

  const body = { name };
  if (options.version != null) body.version = options.version;
  if (options.description != null) body.description = options.description;
  if (options.tags?.length) body.tags = options.tags;

  const features = {};
  if (options.autoscaling) features.autoscalingEnabled = true;
  if (options.persistentStorage) features.csi = true;
  if (Object.keys(features).length > 0) body.features = features;

  body.topologyConfig = await resolveTopologyConfig(options);

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

async function resolveTopologyConfig({ topology, flavor, replicationFactor }) {
  const product = await k8sGetProduct();
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
    const clusters = await listK8sClusters({ ownerId }).then(sendToApi);
    const matchingCluster = clusters.find((cluster) => cluster.name === addonIdOrName.addon_name);
    if (matchingCluster) {
      return matchingCluster.id;
    } else {
      throw new Error(`No Kubernetes cluster found with the name ${styleText('red', addonIdOrName.addon_name)}`);
    }
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
