import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { Logger } from '../logger.js';
import { loadIdsCache, writeIdsCache } from './configuration.js';
import { sendToApi } from './send-to-api.js';

/*
This system uses a simplified representation of the summary to expose IDs links:

* app ID => owner ID
* add-on ID => owner ID
* real add-on ID => owner ID
* add-on ID => real add-on ID
* real add-on ID => add-on ID

{
  owners: {
    [appid]: [ownerId],
    [addonId]: [ownerId],
    [realId]: [ownerId],
  },
  addons: {
    [addonId]: { realId: [realId], addonId: [addonId] },
    [realId]: { realId: [realId], addonId: [addonId] },
  },
}
 */

export async function resolveOwnerId(id) {
  return getIdFromCacheOrSummary((ids) => ids.owners[id]);
}

export async function resolveAddonId(id) {
  const addonId = await getIdFromCacheOrSummary((ids) => {
    return ids.addons[id] != null ? ids.addons[id].addonId : null;
  });

  if (addonId != null) {
    return addonId;
  }

  throw new Error(`Add-on ${id} does not exist`);
}

export async function resolveRealId(id) {
  const realId = await getIdFromCacheOrSummary((ids) => {
    return ids.addons[id] != null ? ids.addons[id].realId : null;
  });

  if (realId != null) {
    return realId;
  }

  throw new Error(`Add-on ${id} does not exist foo`);
}

async function getIdFromCacheOrSummary(callback) {
  const idsFromCache = await loadIdsCache();
  const idFromCache = callback(idsFromCache);
  if (idFromCache != null) {
    return idFromCache;
  }

  const idsFromSummary = await getIdsFromSummary();
  await writeIdsCache(idsFromSummary);

  const idFromSummary = callback(idsFromSummary);
  if (idFromSummary != null) {
    return idFromSummary;
  }

  return null;
}

async function getIdsFromSummary() {
  const ids = {
    owners: {},
    addons: {},
  };

  const summary = await getSummary().then(sendToApi);

  const owners = [summary.user, ...summary.organisations];

  for (const owner of owners) {
    for (const app of owner.applications) {
      ids.owners[app.id] = owner.id;
    }
    for (const addon of owner.addons) {
      ids.owners[addon.id] = owner.id;
      ids.owners[addon.realId] = owner.id;
      const addonIds = { addonId: addon.id, realId: addon.realId };
      ids.addons[addon.id] = addonIds;
      ids.addons[addon.realId] = addonIds;
    }
  }

  return ids;
}

/**
 * Get the IDs and owners of found add-ons from a name, ID or real ID
 * @param {string} addonIdOrRealIdOrName
 * @param {{ orga_name?: string, orga_id?: string }} ownerNameOrId
 * @throws {Error} if no add-on is found
 * @throws {Error} if several add-ons are found
 * @returns {Object} The name, IDs and owner ID of the add-on { name, addonId, realId, ownerId }
 */
export async function findAddonsByNameOrId(addonIdOrRealIdOrName, ownerNameOrId) {
  const summary = await getSummary().then(sendToApi);

  Logger.debug(
    `Searching for add-on '${addonIdOrRealIdOrName}' in ${summary.user.id} and ${summary.organisations.map((org) => org.id).join(', ')}`,
  );
  const candidates = [summary.user, ...summary.organisations]
    .flatMap((owner) => owner.addons.map((addon) => ({ addon, owner })))
    .filter(({ addon, owner }) => {
      const matchOwner =
        ownerNameOrId == null || owner.id === ownerNameOrId.orga_id || owner.name === ownerNameOrId.orga_name;
      const matchAddon =
        addon.name === addonIdOrRealIdOrName ||
        addon.realId === addonIdOrRealIdOrName ||
        addon.id === addonIdOrRealIdOrName;
      return matchOwner && matchAddon;
    })
    .map(({ addon, owner }) => ({
      name: addon.name,
      addonId: addon.id,
      realId: addon.realId,
      ownerId: owner.id,
    }));

  Logger.debug(`Found ${candidates.length} candidate(s):`);
  for (const candidate of candidates) {
    Logger.debug(`  - ${candidate.addonId} (${candidate.ownerId})`);
  }

  return candidates;
}

/**
 * Get the IDs and owners of found add-ons from a name, ID or real ID
 * @param {string} addonIdOrRealIdOrName
 * @throws {Error} if no add-on is found
 * @throws {Error} if several add-ons are found
 * @returns {Object} The name, IDs and owner ID of the add-on { name, addonId, realId, ownerId }
 */
export async function findAddonsByAddonProvider(provider) {
  const summary = await getSummary().then(sendToApi);

  Logger.debug(
    `Searching for ${provider} add-ons in ${summary.user.id} and ${summary.organisations.map((org) => org.id).join(', ')}`,
  );
  const candidates = [summary.user, ...summary.organisations].flatMap((owner) => {
    return owner.addons
      .filter((addon) => addon.providerId === provider)
      .map((addon) => {
        return {
          name: addon.name,
          addonId: addon.id,
          realId: addon.realId,
          ownerId: owner.id,
          ownerName: owner.name,
        };
      });
  });

  Logger.debug(`Found ${candidates.length} candidate(s) for provider ${provider}:`);
  for (const candidate of candidates) {
    Logger.debug(`  - ${candidate.addonId} (${candidate.ownerId})`);
  }

  return candidates;
}
