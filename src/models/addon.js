'use strict';

const application = require('@clevercloud/client/cjs/api/v2/application.js');
const autocomplete = require('cliparse').autocomplete;
const colors = require('colors/safe');
const { get: getAddon, getAll: getAllAddons, remove: removeAddon, create: createAddon, preorder: preorderAddon, update: updateAddon } = require('@clevercloud/client/cjs/api/v2/addon.js');
const { getAllAddonProviders } = require('@clevercloud/client/cjs/api/v2/product.js');
const { getSummary } = require('@clevercloud/client/cjs/api/v2/user.js');
const { getAddonProvider } = require('@clevercloud/client/cjs/api/v4/addon-providers.js');

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

function getProviderInfos (providerName) {
  return getAddonProvider({ providerId: providerName }).then(sendToApi)
    .catch(() => {
      // An error can occur because the add-on api doesn't implement this endpoint yet
      // This is fine, just ignore it
      Logger.debug(`${providerName} doesn't yet implement the provider info endpoint`);
      return Promise.resolve(null);
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

function validateAddonVersionAndOptions (region, version, addonOptions, providerInfos, planType) {
  if (providerInfos != null) {
    if (version != null) {
      const type = planType.value.toLowerCase();
      if (type === 'shared') {
        const cluster = providerInfos.clusters.find(({ zone }) => zone === region);
        if (cluster == null) {
          throw new Error(`Can't find cluster for region ${region}`);
        }
        else if (cluster.version !== version) {
          throw new Error(`Invalid version ${version}, selected shared cluster only supports version ${cluster.version}`);
        }
      }
      else if (type === 'dedicated') {
        const availableVersions = Object.keys(providerInfos.dedicated);
        const hasVersion = availableVersions.find((availableVersion) => availableVersion === version);
        if (hasVersion == null) {
          throw new Error(`Invalid version ${addonOptions.version}, available versions are: ${availableVersions.join(', ')}`);
        }
      }
    }

    const chosenVersion = version != null ? version : providerInfos.defaultDedicatedVersion;

    // Check the selected options to see if the chosen plan / region offers them
    // If not, abort the creation
    if (Object.keys(addonOptions).length > 0) {
      const type = planType.value.toLowerCase();
      let availableOptions = [];
      if (type === 'shared') {
        const cluster = providerInfos.clusters.find(({ zone }) => zone === region);
        if (cluster == null) {
          throw new Error(`Can't find cluster for region ${region}`);
        }

        availableOptions = cluster.features;
      }
      else if (type === 'dedicated') {
        availableOptions = providerInfos.dedicated[chosenVersion].features;
      }

      for (const selectedOption in addonOptions) {
        const isAvailable = availableOptions.find(({ name }) => name === selectedOption);
        if (isAvailable == null) {
          const optionNames = availableOptions.map(({ name }) => name).join(',');
          let availableOptionsError = null;
          if (optionNames.length > 0) {
            availableOptionsError = `Avalailble options are: ${optionNames}.`;
          }
          else {
            availableOptionsError = 'No options are available for this plan.';
          }

          throw new Error(`Option "${selectedOption}" is not available on this plan. ${availableOptionsError}`);
        }
      }
    }

    return {
      version: chosenVersion,
      ...addonOptions,
    };
  }
  else {
    if (version != null) {
      throw new Error('You provided a version for an add-on that doesn\'t support choosing the version.');
    }
    return {};
  }
}

async function create ({ ownerId, name, providerName, planName, region, skipConfirmation, version, addonOptions }) {

  // TODO: We should be able to use it without {}
  const providers = await listProviders();

  const provider = providers.find((p) => p.id === providerName);
  if (provider == null) {
    throw new Error('invalid provider name');
  }
  if (!provider.regions.includes(region)) {
    throw new Error(`invalid region name. Available regions: ${provider.regions.join(', ')}`);
  }

  const plan = provider.plans.find((p) => p.slug.toLowerCase() === planName.toLowerCase());
  if (plan == null) {
    const availablePlans = provider.plans.map((p) => p.slug);
    throw new Error(`invalid plan name. Available plans: ${availablePlans.join(', ')}`);
  }

  const providerInfos = await getProviderInfos(provider.id);
  const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');

  // If we have a providerInfos but we don't have a planType, we won't be able to go further
  // The process should stop here to make sure users don't create something they don't intend to
  // This missing feature should have been added during the add-on's development phase
  // The console has a similar check so I believe we shouldn't hit this
  if (providerInfos != null && planType == null) {
    throw new Error('Internal error. The selected plan misses the TYPE feature. Please contact our support with the command line you used');
  }

  const createOptions = validateAddonVersionAndOptions(region, version, addonOptions, providerInfos, planType);

  const addonToCreate = {
    name,
    plan: plan.id,
    providerId: provider.id,
    region,
    options: createOptions,
  };

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

function parseAddonOptions (options) {
  if (options == null) {
    return {};
  }

  return options.split(',').reduce((options, option) => {
    const [key, value] = option.split('=');
    if (value == null) {
      throw new Error("Options are malformed. Usage is '--option name=enabled|disabled|true|false'");
    }

    let formattedValue = value;
    if (value === 'true' || value === 'enabled') {
      formattedValue = 'true';
    }
    else if (value === 'false' || value === 'disabled') {
      formattedValue = 'false';
    }
    else {
      throw new Error(`Can't parse option value: ${value}. Accepted values are: enabled, disabled, true, false`);
    }

    options[key] = formattedValue;
    return options;
  }, {});
}

module.exports = {
  completePlan,
  completeRegion,
  create,
  delete: deleteAddon,
  findById,
  getProvider,
  getProviderInfos,
  link,
  list,
  listProviders,
  parseAddonOptions,
  rename,
  unlink,
};
