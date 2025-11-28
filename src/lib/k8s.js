import { styleText } from './style-text.js';

import {
  addK8sPersistentStorage,
  createK8sCluster,
  deleteK8sCluster,
  getK8sAddon,
  getK8sConfig,
  listK8sClusters,
} from '../clever-client/k8s.js';
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
 * @param {string} ownerId The owner ID
 * @returns {Promise<void>}
 */
export async function k8sCreate(name, ownerId) {
  ownerId = await getOwnerIdFromOrgIdOrName(ownerId);

  return createK8sCluster({ ownerId }, { name }).then(sendToApi);
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
