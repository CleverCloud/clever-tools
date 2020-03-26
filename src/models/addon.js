'use strict';

const _ = require('lodash');
const application = require('@clevercloud/client/cjs/api/application.js');
const autocomplete = require('cliparse').autocomplete;
const Bacon = require('baconjs');
const colors = require('colors/safe');
const { get: getAddon, getAll: getAllAddons } = require('@clevercloud/client/cjs/api/addon.js');
const { getSummary } = require('@clevercloud/client/cjs/api/user.js');

const Interact = require('./interact.js');
const Logger = require('../logger.js');
const { sendToApi } = require('../models/send-to-api.js');

function listProviders (api) {
  return api.products.addonproviders.get().send();
}

function getProvider (api, providerName) {
  return api.products.addonproviders.get().send()
    .flatMapLatest((providers) => {
      const provider = _.find(providers, { id: providerName });
      return provider || new Bacon.Error('invalid provider name');
    });
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

function createAndLink (api, name, providerName, plan, region, skipConfirmation, appData) {
  return create(api, appData.org_id, name, providerName, plan, region, skipConfirmation)
    .flatMapLatest((addon) => link(api, appData.app_id, appData.org_id, { addon_id: addon.id }));
}

function create (api, orgaId, name, providerName, planName, region, skipConfirmation) {

  return api.products.addonproviders.get().send()
    .flatMapLatest((providers) => {
      const provider = _.find(providers, { id: providerName });
      if (provider == null) {
        return new Bacon.Error('invalid provider name');
      }
      if (!_.includes(provider.regions, region)) {
        return new Bacon.Error(`invalid region name. Available regions: ${provider.regions.join(', ')}`);
      }
      return provider;
    })
    .flatMapLatest((provider) => {
      const plan = _.find(provider.plans, { slug: planName });
      const availablePlans = _.map(provider.plans, 'slug');
      return plan || new Bacon.Error(`invalid plan name. Available plans: ${availablePlans.join(', ')}`);
    })
    .flatMapLatest((plan) => {
      return performPreorder(api, orgaId, name, plan.id, providerName, region)
        .flatMapLatest((result) => {
          if (result.totalTTC > 0 && !skipConfirmation) {
            result.lines.forEach(({ description, VAT, price }) => Logger.println(`${description}\tVAT: ${VAT}%\tPrice: ${price}€`));
            Logger.println(`Total (without taxes): ${result.totalHT}€`);
            Logger.println(colors.bold(`Total (with taxes): ${result.totalTTC}€`));
            const s_confirm = Interact.confirm(
              `You're about to pay ${result.totalTTC}€, confirm? (yes or no) `,
              'No confirmation, aborting addon creation',
            );
            return s_confirm.map(_.constant(plan));
          }
          return Bacon.once(plan);
        });
    })
    .flatMapLatest((plan) => {
      return performCreation(api, orgaId, name, plan.id, providerName, region);
    });
}

/**
 * Generate a preview creation, to get access to the price that will be charged,
 * as well as to verify that the payment methods are correctly configured
 */
function performPreorder (api, orgaId, name, planId, providerId, region) {
  const params = orgaId ? [orgaId] : [];
  return api.owner(orgaId).addons.preorders.post().withParams(params).send(JSON.stringify({
    name: name,
    plan: planId,
    providerId: providerId,
    region: region,
  }));
}

function performCreation (api, orgaId, name, planId, providerId, region) {
  const params = orgaId ? [orgaId] : [];
  return api.owner(orgaId).addons.post().withParams(params).send(JSON.stringify({
    name: name,
    plan: planId,
    providerId: providerId,
    region: region,
  }));
}

function getByName (api, orgaId, addonName) {
  const s_addons = orgaId
    ? api.owner(orgaId).addons.get().withParams([orgaId]).send()
    : api.owner().addons.get().withParams().send();

  return s_addons.flatMapLatest((addons) => {
    const filtered_addons = _.filter(addons, ({ name, realId }) => {
      return name === addonName || realId === addonName;
    });
    if (filtered_addons.length === 1) {
      return Bacon.once(filtered_addons[0]);
    }
    if (filtered_addons.length === 0) {
      return Bacon.once(new Bacon.Error('Addon not found'));
    }
    return Bacon.once(new Bacon.Error('Ambiguous addon name'));
  });
}

async function getByNameProm (ownerId, addonNameOrRealId) {
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

function getId (api, orgaId, addonIdOrName) {
  if (addonIdOrName.addon_id) {
    return Bacon.once(addonIdOrName.addon_id);
  }
  return getByName(api, orgaId, addonIdOrName.addon_name)
    .map((addon) => addon.id);
}

async function getIdProm (ownerId, addon) {
  if (addon.addon_id) {
    return addon.addon_id;
  }
  const addonDetails = await getByNameProm(ownerId, addon.addon_name);
  return addonDetails.id;
}

async function link (ownerId, appId, addon) {
  const addonId = await getIdProm(ownerId, addon);
  return application.linkAddon({ id: ownerId, appId }, JSON.stringify(addonId)).then(sendToApi);
}

async function unlink (ownerId, appId, addon) {
  const addonId = await getIdProm(ownerId, addon);
  return application.unlinkAddon({ id: ownerId, appId, addonId }).then(sendToApi);
}

function deleteAddon (api, orgaId, addonIdOrName, skipConfirmation) {
  return getId(api, orgaId, addonIdOrName)
    .flatMapLatest((addonId) => {
      const params = orgaId ? [orgaId, addonId] : [addonId];
      const confirmation = skipConfirmation
        ? Bacon.once()
        : Interact.confirm('Deleting the addon can\'t be undone, are you sure? ', 'No confirmation, aborting addon deletion');

      return confirmation.flatMapLatest(() => {
        return api.owner(orgaId).addons._.delete().withParams(params).send();
      });
    });
}

function rename (api, orgaId, addonIdOrName, newName) {
  return getId(api, orgaId, addonIdOrName)
    .flatMapLatest((addonId) => {
      const params = orgaId ? [orgaId, addonId] : [addonId];
      return api.owner(orgaId).addons._.put().withParams(params).send(JSON.stringify({
        name: newName,
      }));
    });
}

function completeRegion () {
  return autocomplete.words(['eu', 'us']);
}

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

module.exports = {
  listProviders,
  getProvider,
  list,
  createAndLink,
  create,
  getByName,
  getId,
  link,
  unlink,
  delete: deleteAddon,
  rename,
  completeRegion,
  completePlan,
  findById,
};
