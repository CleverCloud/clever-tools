import dedent from 'dedent';
import z from 'zod';
import { readJsonSync, writeJson } from '../lib/fs.js';
import { Logger } from '../logger.js';
import { config } from './config.js';
import { getConfigPath } from './paths.js';

const EXPERIMENTAL_FEATURES_FILEPATH = getConfigPath('clever-tools-experimental-features.json');

export const EXPERIMENTAL_FEATURES = {
  'system-git': {
    status: 'beta',
    description: 'Use system git instead of current JS implementation for git operations',
    instructions: dedent`
      This feature switches from the current JS implementation to using
      the git installed on your system.

      Requirements:
        - git must be installed and available in your PATH
    `,
  },
  k8s: {
    status: 'beta',
    description: 'Deploy and manage Kubernetes clusters on Clever Cloud',
    instructions: dedent`
      - Create a Kubernetes cluster:
          clever k8s create my-cluster
          clever k8s create my-cluster --org myOrg

      - List Kubernetes clusters:
          clever k8s list

      - Get details about a Kubernetes cluster:
          clever k8s get my-cluster

      - Get kubeconfig file for a Kubernetes cluster:
          clever k8s get-kubeconfig my-cluster
          clever k8s get-kubeconfig my-cluster > ~/.kube/config

      - Activate persistent storage on a Kubernetes cluster:
          clever k8s add-persistent-storage my-cluster

      - Delete a Kubernetes cluster:
          clever k8s delete my-cluster

      Learn more about Clever Kubernetes: ${config.DOC_URL}/kubernetes/
    `,
  },
  kv: {
    status: 'beta',
    description:
      'Send commands to databases such as Materia KV or Redis® directly from Clever Tools, without other dependencies',
    instructions: dedent`
      Target any compatible add-on by its name or ID (with an org ID if needed) and send commands to it:

          clever kv myMateriaKV SET myKey myValue
          clever kv kv_xxxxxxxx GET myKey -F json
          clever kv addon_xxxxx SET myTempKey myTempValue EX 120
          clever kv myMateriaKV -o myOrg TTL myTempKey
          clever kv redis_xxxxx --org org_xxxxx PING

      Learn more about Materia KV: ${config.DOC_URL}/addons/materia-kv/
    `,
  },
  ng: {
    status: 'beta',
    description: 'Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network',
    instructions: dedent`
      - Create a Network Group:
          clever ng create myNG
      - Create a Network Group with members (application, database add-on):
          clever ng create myNG --link app_xxx,postgresql_xxx
      - List Network Groups:
          clever ng
      - Delete a Network Group:
          clever ng delete myNG
      - (Un)Link an application or a database add-on to an existing Network Group:
          clever ng link app_xxx myNG
          clever ng unlink postgresql_xxx myNG
      - Get the WireGuard configuration of a peer:
          clever ng get-config peerIdOrLabel myNG
      - Get details about a Network Group, a member or a peer:
          clever ng get myNg
          clever ng get app_xxx
          clever ng get peerId
          clever ng get memberLabel
      - Search Network Groups, members or peers:
          clever ng search myQuery

      Learn more about Network Groups: ${config.DOC_URL}/develop/network-groups/
    `,
  },
  operators: {
    status: 'beta',
    description: 'Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi',
    instructions: dedent`
      clever keycloak
      clever keycloak get keycloak_xxx
      clever keycloak ng enable myKeycloak

      clever metabase version check myMetabase
      clever metabase version update myMetabase 0.53

      clever matomo open myMatomo
      clever otoroshi open logs myOtoroshi
    `,
  },
};

const FeaturesConfigSchema = z
  .object(Object.fromEntries(Object.keys(EXPERIMENTAL_FEATURES).map((key) => [key, z.boolean()])))
  .partial();

/**
 * @typedef {z.infer<typeof FeaturesConfigSchema>} FeaturesConfig
 */

/**
 * The features explicitly set by the user, loaded synchronously at startup.
 * @type {FeaturesConfig}
 */
let userFeatures = loadFeatures();

/**
 * Reads and parses the features file.
 * Returns an empty object if the file doesn't exist or is invalid.
 * @returns {FeaturesConfig} The features configuration object
 */
function loadFeatures() {
  Logger.debug(`Load features configuration from ${EXPERIMENTAL_FEATURES_FILEPATH}`);
  const rawFeatures = readJsonSync(EXPERIMENTAL_FEATURES_FILEPATH);
  if (rawFeatures == null) {
    return {};
  }
  const parsed = FeaturesConfigSchema.safeParse(rawFeatures);
  if (!parsed.success) {
    Logger.info(`Invalid features format in ${EXPERIMENTAL_FEATURES_FILEPATH}`);
    return {};
  }
  return parsed.data;
}

/**
 * Sets an experimental feature to the specified value.
 * Creates the configuration directory and features file if they don't exist,
 * then reloads the in-memory configuration.
 * @param {string} feature - The name of the feature to set
 * @param {boolean} value - The value to set for the feature
 * @returns {Promise<void>}
 * @throws {Error} If the features file cannot be written
 */
export async function setFeature(feature, value) {
  const newFeatures = { ...userFeatures, [feature]: value };
  try {
    await writeJson(EXPERIMENTAL_FEATURES_FILEPATH, newFeatures, { mode: 0o700 });
  } catch (error) {
    throw new Error(`Cannot write experimental features configuration to ${EXPERIMENTAL_FEATURES_FILEPATH}`);
  }
  userFeatures = loadFeatures();
}

/**
 * Checks if an experimental feature is enabled.
 * @param {string} feature - The name of the feature to check
 * @returns {boolean} True if the feature is explicitly enabled, false otherwise
 */
export function isFeatureEnabled(feature) {
  return userFeatures[feature] === true;
}

/**
 * Lists all experimental features with their current status.
 * @returns {Array<{ id: string, status: string, description: string, instructions?: string, enabled: boolean }>}
 */
export function getAllFeatures() {
  return Object.entries(EXPERIMENTAL_FEATURES).map(([id, feature]) => ({
    id,
    ...feature,
    enabled: isFeatureEnabled(id),
  }));
}
