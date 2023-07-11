const { getSummary } = require('@clevercloud/client/cjs/api/v2/user.js');
const { sendToApi } = require('./send-to-api.js');
const { loadIdsCache, writeIdsCache } = require('./configuration.js');

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

async function resolveOwnerId (id) {
  return getIdFromCacheOrSummary((ids) => ids.owners[id]);
}

async function resolveAddonId (id) {

  const addonId = await getIdFromCacheOrSummary((ids) => {
    return (ids.addons[id] != null) ? ids.addons[id].addonId : null;
  });

  if (addonId != null) {
    return addonId;
  }

  throw new Error(`Add-on ${id} does not exist`);
}

async function resolveRealId (id) {

  const realId = await getIdFromCacheOrSummary((ids) => {
    return (ids.addons[id] != null) ? ids.addons[id].realId : null;
  });

  if (realId != null) {
    return realId;
  }

  throw new Error(`Add-on ${id} does not exist foo`);
}

async function getIdFromCacheOrSummary (callback) {

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

async function getIdsFromSummary () {

  const ids = {
    owners: {},
    addons: {},
  };

  const summary = await getSummary().then(sendToApi);

  const owners = [
    summary.user,
    ...summary.organisations,
  ];

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

module.exports = {
  resolveOwnerId,
  resolveAddonId,
  resolveRealId,
};
