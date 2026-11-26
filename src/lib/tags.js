import {
  get as getAddon,
  getAllTags as getAddonTags,
  addTag as putAddonTag,
  removeTag as removeAddonTag,
  replaceAddonTags,
} from '@clevercloud/client/esm/api/v2/addon.js';
import {
  get as getApplication,
  getAllTags as getApplicationTags,
  updateTag as putApplicationTag,
  removeTag as removeApplicationTag,
} from '@clevercloud/client/esm/api/v2/application.js';
import { updateApplicationTags } from '@clevercloud/client/esm/api/v2/organisation.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { getNetworkGroup } from '@clevercloud/client/esm/api/v4/network-group.js';
import { getK8sAddon as getK8sCluster, updateK8sCluster } from '../clever-client/k8s.js';
import { resolveOwnerIdWithAddon } from '../models/ids-resolver.js';
import { sendToApi } from '../models/send-to-api.js';
import { styleText } from './style-text.js';

/**
 * @typedef {'application'|'addon'|'kubernetes'|'network-group'} TagTargetType
 */

/**
 * A resource carrying tags
 * @typedef {object} TagTarget
 * @property {TagTargetType} type
 * @property {string} ownerId
 * @property {string} id ID used by the tags endpoints (the add-on ID for an add-on, not its real ID)
 * @property {string} name
 * @property {Array<string>} [tags] Tags already known from the resource itself (Kubernetes clusters, Network Groups)
 */

/** @type {Record<TagTargetType, string>} */
const TYPE_LABELS = {
  application: 'application',
  addon: 'add-on',
  kubernetes: 'Kubernetes cluster',
  'network-group': 'Network Group',
};

/**
 * Describe a target for the user, e.g. "application my-app (app_xxx)"
 * @param {TagTarget} target
 * @returns {string}
 */
export function formatTagTarget(target) {
  return `${TYPE_LABELS[target.type]} ${target.name} (${target.id})`;
}

/**
 * Fail before any API call when the tags of this ID cannot be changed
 * @param {string} id
 * @throws {Error} For a Network Group, the API has no endpoint to change its tags yet
 */
export function assertTagsCanBeChanged(id) {
  if (id.startsWith('ng_')) {
    throw new Error(
      `Tags of Network Groups cannot be changed yet, only ${styleText('blue', 'clever tags list')} works on them`,
    );
  }
}

/**
 * Find the resources whose tags are managed through an ID, detected from it: application, add-on (ID or real ID),
 * Kubernetes cluster or Network Group.
 * The first target is the resource of the ID. With `withLinkedAddon`, an SFTP application also returns its FS bucket
 * add-on, which carries the same ID and gets the same tags changes.
 * @param {string} id
 * @param {object} [options]
 * @param {boolean} [options.withLinkedAddon]
 * @returns {Promise<Array<TagTarget>>}
 */
export async function resolveTagTargets(id, { withLinkedAddon = false } = {}) {
  if (id.startsWith('kubernetes_')) {
    return [await findInOwners(id, 'kubernetes', 'Kubernetes cluster')];
  }
  if (id.startsWith('ng_')) {
    return [await findInOwners(id, 'network-group', 'Network Group')];
  }

  const resolved = await resolveOwnerIdWithAddon(id);
  if (resolved == null) {
    throw new Error(`No application or add-on found with ID ${id}`);
  }
  const { ownerId, addon } = resolved;

  if (id.startsWith('app_')) {
    const app = await getApplication({ id: ownerId, appId: id }).then(sendToApi);
    /** @type {Array<TagTarget>} */
    const targets = [{ type: 'application', ownerId, id, name: app.name }];
    if (withLinkedAddon && addon != null) {
      targets.push(await getAddonTarget(ownerId, addon.addonId));
    }
    return targets;
  }

  return [await getAddonTarget(ownerId, addon?.addonId ?? id)];
}

/**
 * @param {TagTarget} target
 * @returns {Promise<Array<string>>}
 */
export async function getTags(target) {
  const { type, ownerId, id } = target;
  switch (type) {
    case 'application':
      return getApplicationTags({ id: ownerId, appId: id }).then(sendToApi);
    case 'addon':
      return getAddonTags({ id: ownerId, addonId: id }).then(sendToApi);
    default:
      return target.tags ?? [];
  }
}

/**
 * @param {TagTarget} target
 * @param {string} tag
 * @returns {Promise<void>}
 */
export async function addTag(target, tag) {
  const { type, ownerId, id } = target;
  switch (type) {
    case 'application':
      await putApplicationTag({ id: ownerId, appId: id, tag: encodeURIComponent(tag) }).then(sendToApi);
      return;
    case 'addon':
      await putAddonTag({ id: ownerId, addonId: id, tag: encodeURIComponent(tag) }).then(sendToApi);
      return;
    case 'kubernetes': {
      const tags = target.tags ?? [];
      if (!tags.includes(tag)) {
        await updateK8sCluster({ ownerId, clusterId: id }, { tags: [...tags, tag] }).then(sendToApi);
      }
      return;
    }
    default:
      assertTagsCanBeChanged(id);
  }
}

/**
 * @param {TagTarget} target
 * @param {string} tag
 * @returns {Promise<void>}
 */
export async function removeTag(target, tag) {
  const { type, ownerId, id } = target;
  switch (type) {
    case 'application':
      await removeApplicationTag({ id: ownerId, appId: id, tag: encodeURIComponent(tag) }).then(sendToApi);
      return;
    case 'addon':
      await removeAddonTag({ id: ownerId, addonId: id, tag: encodeURIComponent(tag) })
        .then(sendToApi)
        .catch((error) => {
          // Unlike applications, add-ons answer 404 for a tag they don't have (an unknown add-on gets a 403):
          // removing it is a no-op, not an error
          if (error.response?.status !== 404) {
            throw error;
          }
        });
      return;
    case 'kubernetes': {
      const tags = target.tags ?? [];
      if (tags.includes(tag)) {
        await updateK8sCluster({ ownerId, clusterId: id }, { tags: tags.filter((t) => t !== tag) }).then(sendToApi);
      }
      return;
    }
    default:
      assertTagsCanBeChanged(id);
  }
}

/**
 * @param {TagTarget} target
 * @returns {Promise<void>}
 */
export async function removeAllTags(target) {
  const { type, ownerId, id } = target;
  switch (type) {
    case 'application':
      await updateApplicationTags({ id: ownerId, appId: id }, []).then(sendToApi);
      return;
    case 'addon':
      await replaceAddonTags({ id: ownerId, addonId: id }, []).then(sendToApi);
      return;
    case 'kubernetes':
      await updateK8sCluster({ ownerId, clusterId: id }, { tags: [] }).then(sendToApi);
      return;
    default:
      assertTagsCanBeChanged(id);
  }
}

/**
 * @param {string} ownerId
 * @param {string} addonId
 * @returns {Promise<TagTarget>}
 */
async function getAddonTarget(ownerId, addonId) {
  const addon = await getAddon({ id: ownerId, addonId }).then(sendToApi);
  return { type: 'addon', ownerId, id: addon.id, name: addon.name };
}

/**
 * Kubernetes clusters and Network Groups are not in the IDs cache: look for the resource in every owner of the user
 * @param {string} id
 * @param {'kubernetes'|'network-group'} type
 * @param {string} typeLabel
 * @returns {Promise<TagTarget>}
 */
async function findInOwners(id, type, typeLabel) {
  const summary = await getSummary().then(sendToApi);
  // The personal space shows up both in `user` and in `organisations`
  const ownerIds = [...new Set([summary.user, ...summary.organisations].map((owner) => owner.id))];

  const found = await Promise.all(
    ownerIds.map((ownerId) => {
      const request =
        type === 'kubernetes'
          ? getK8sCluster({ ownerId, clusterId: id })
          : getNetworkGroup({ ownerId, networkGroupId: id });
      return request
        .then(sendToApi)
        .then((resource) => ({ ownerId, resource }))
        .catch((error) => {
          // `sendToApi` turns a 401 into a login error, the original one is its cause
          const status = error.response?.status ?? error.cause?.response?.status;
          // The Network Groups API answers 401 for a Network Group of another owner
          if (status === 401 || status === 403 || status === 404) {
            return null;
          }
          throw error;
        });
    }),
  );

  const match = found.find((result) => result != null);
  if (match == null) {
    throw new Error(`No ${typeLabel} found with ID ${id}`);
  }

  const { ownerId, resource } = match;
  return { type, ownerId, id, name: resource.name ?? resource.label, tags: resource.tags ?? [] };
}
