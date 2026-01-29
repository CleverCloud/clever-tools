import dedent from 'dedent';
import { z } from 'zod';
import { Logger } from '../logger.js';
import { conf } from './config.js';
import { readJson, writeJson } from './paths.js';

export const EXPERIMENTAL_FEATURES = {
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

      Learn more about Clever Kubernetes: ${conf.DOC_URL}/kubernetes/
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

      Learn more about Materia KV: ${conf.DOC_URL}/addons/materia-kv/
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

      Learn more about Network Groups: ${conf.DOC_URL}/develop/network-groups/
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

/** @typedef {z.infer<typeof FeaturesConfigSchema>} FeaturesConfig */

/**
 * Gets the current experimental features configuration.
 * Returns an empty object if the features file doesn't exist or is invalid.
 * @returns {Promise<FeaturesConfig>} The features configuration object
 */
export async function getFeatures() {
  Logger.debug(`Get features configuration from ${conf.EXPERIMENTAL_FEATURES_FILE}`);
  try {
    const json = await readJson(conf.EXPERIMENTAL_FEATURES_FILE);
    const parsed = FeaturesConfigSchema.safeParse(json);
    if (!parsed.success) {
      Logger.info(`Invalid features format in ${conf.EXPERIMENTAL_FEATURES_FILE}`);
      return {};
    }
    return parsed.data;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Cannot get experimental features configuration from ${conf.EXPERIMENTAL_FEATURES_FILE}`);
    }
    return {};
  }
}

/**
 * Sets an experimental feature to the specified value.
 * Creates the configuration directory and features file if they don't exist.
 * @param {string} feature - The name of the feature to set
 * @param {boolean} value - The value to set for the feature
 * @returns {Promise<void>}
 * @throws {Error} If the features file cannot be written
 */
export async function setFeature(feature, value) {
  const currentFeatures = await getFeatures();
  const newFeatures = { ...currentFeatures, [feature]: value };
  try {
    await writeJson(conf.EXPERIMENTAL_FEATURES_FILE, newFeatures);
  } catch (error) {
    throw new Error(
      `Cannot write experimental features configuration to ${conf.EXPERIMENTAL_FEATURES_FILE}\n${error.message}`,
    );
  }
}
