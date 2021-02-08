'use strict';

const application = require('@clevercloud/client/cjs/api/application.js');
const autocomplete = require('cliparse').autocomplete;
const colors = require('colors/safe');
const {
  get: getAddon,
  getAll: getAllAddons,
  remove: removeAddon,
  create: createAddon,
  preorder: preorderAddon,
  update: updateAddon,
  getAllEnvVars,
} = require('@clevercloud/client/cjs/api/addon.js');
const { getAllAddonProviders } = require('@clevercloud/client/cjs/api/product.js');
const { getSummary } = require('@clevercloud/client/cjs/api/user.js');

const Interact = require('./interact.js');
const Logger = require('../logger.js');
const { sendToApi } = require('../models/send-to-api.js');

function listProviders () {
  return getAllAddonProviders({}).then(sendToApi);
}

async function getProvider (providerName) {
  const providers = await listProviders();
  const provider = providers.find((p) => p.id === providerName);
  if (provider == null) {
    throw new Error('invalid provider name');
  }
  return provider;
}

async function list (ownerId, appId, showAll) {
  const allAddons = await getAllAddons({ id: ownerId }).then(sendToApi);

  if (appId == null) {
    // Not linked to a specific app, show everything
    return allAddons;
  }

  const myAddons = await application.getAllLinkedAddons({ id: ownerId, appId }).then(sendToApi);

  if (showAll == null) {
    return myAddons;
  }

  const myAddonIds = myAddons.map((addon) => addon.id);
  return allAddons.map((addon) => {
    const isLinked = myAddonIds.includes(addon.id);
    return { ...addon, isLinked };
  });
}

async function create ({ ownerId, name, providerName, planName, region, skipConfirmation }) {

  // TODO: We should be able to use it without {}
  const providers = await listProviders();

  const provider = providers.find((p) => p.id === providerName);
  if (provider == null) {
    throw new Error('invalid provider name');
  }
  if (!provider.regions.includes(region)) {
    throw new Error(`invalid region name. Available regions: ${provider.regions.join(', ')}`);
  }

  const plan = provider.plans.find((p) => p.slug === planName);
  if (plan == null) {
    const availablePlans = provider.plans.map((p) => p.slug);
    throw new Error(`invalid plan name. Available plans: ${availablePlans.join(', ')}`);
  }

  const addonToCreate = { name, plan: plan.id, providerId: provider.id, region };
  const result = await preorderAddon({ id: ownerId }, addonToCreate).then(sendToApi);

  if (result.totalTTC > 0 && !skipConfirmation) {
    result.lines.forEach(({ description, VAT, price }) => Logger.println(`${description}\tVAT: ${VAT}%\tPrice: ${price}€`));
    Logger.println(`Total (without taxes): ${result.totalHT}€`);
    Logger.println(colors.bold(`Total (with taxes): ${result.totalTTC}€`));

    await Interact.confirm(
      `You're about to pay ${result.totalTTC}€, confirm? (yes or no) `,
      'No confirmation, aborting addon creation',
    );
  }

  return createAddon({ id: ownerId }, addonToCreate).then(sendToApi);
}

async function getByName (ownerId, addonNameOrRealId) {
  const addons = await getAllAddons({ id: ownerId }).then(sendToApi);
  const filteredAddons = addons.filter(({ name, realId }) => {
    return name === addonNameOrRealId || realId === addonNameOrRealId;
  });
  if (filteredAddons.length === 1) {
    return filteredAddons[0];
  }
  if (filteredAddons.length === 0) {
    throw new Error('Addon not found');
  }
  throw new Error('Ambiguous addon name');
}

async function getId (ownerId, addon) {
  if (addon.addon_id) {
    return addon.addon_id;
  }
  const addonDetails = await getByName(ownerId, addon.addon_name);
  return addonDetails.id;
}

async function link (ownerId, appId, addon) {
  const addonId = await getId(ownerId, addon);
  return application.linkAddon({ id: ownerId, appId }, JSON.stringify(addonId)).then(sendToApi);
}

async function unlink (ownerId, appId, addon) {
  const addonId = await getId(ownerId, addon);
  return application.unlinkAddon({ id: ownerId, appId, addonId }).then(sendToApi);
}

async function deleteAddon (ownerId, addonIdOrName, skipConfirmation) {
  const addonId = await getId(ownerId, addonIdOrName);

  if (!skipConfirmation) {
    await Interact.confirm('Deleting the addon can\'t be undone, are you sure? ', 'No confirmation, aborting addon deletion');
  }

  return removeAddon({ id: ownerId, addonId }).then(sendToApi);
}

async function rename (ownerId, addon, name) {
  const addonId = await getId(ownerId, addon);
  return updateAddon({ id: ownerId, addonId }, { name }).then(sendToApi);
}

function completeRegion () {
  return autocomplete.words(['par', 'mtl']);
}

// TODO: We need to fix this
function completePlan () {
  return autocomplete.words(['dev', 's', 'm', 'l', 'xl', 'xxl']);
}

async function findById (addonId) {
  const { user, organisations } = await getSummary({}).then(sendToApi);
  for (const orga of [user, ...organisations]) {
    for (const simpleAddon of orga.addons) {
      if (simpleAddon.id === addonId) {
        const addon = await getAddon({ id: orga.id, addonId }).then(sendToApi);
        return {
          ...addon,
          orgaId: orga.id,
        };
      }
    }
  }
  throw new Error(`Could not find add-on with ID: ${addonId}`);
}

async function listAddonEnv (organisationId, addonId) {
  return getAllEnvVars({
    id: organisationId,
    addonId,
  }).then(sendToApi);
}

module.exports = {
  completePlan,
  completeRegion,
  create,
  delete: deleteAddon,
  findById,
  getProvider,
  link,
  list,
  listProviders,
  rename,
  unlink,
  listAddonEnv,
};
