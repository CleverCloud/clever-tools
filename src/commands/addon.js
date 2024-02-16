'use strict';

const _ = require('lodash');
const colors = require('colors/safe');

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const formatTable = require('../format-table')();
const Logger = require('../logger.js');
const Organisation = require('../models/organisation.js');
const User = require('../models/user.js');
const { parseAddonOptions, findOwnerId } = require('../models/addon.js');
const { getAllEnvVars } = require('@clevercloud/client/cjs/api/v2/addon.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString } = require('@clevercloud/client/cjs/utils/env-vars.js');
const { resolveAddonId } = require('../models/ids-resolver.js');

async function list (params) {
  const { org: orgaIdOrName } = params.options;

  const ownerId = await Organisation.getId(orgaIdOrName);
  const addons = await Addon.list(ownerId);

  const formattedAddons = addons.map((addon) => {
    return [
      addon.plan.name + ' ' + addon.provider.name,
      addon.region,
      colors.bold.green(addon.name),
      addon.id,
    ];
  });
  Logger.println(formatTable(formattedAddons));
}

async function create (params) {
  const [providerName, name] = params.args;
  const {
    link: linkedAppAlias,
    plan: planName,
    region,
    yes: skipConfirmation,
    org: orgaIdOrName,
    format,
  } = params.options;
  const version = params.options['addon-version'];
  const addonOptions = parseAddonOptions(params.options.option);

  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  const addonToCreate = {
    ownerId,
    name,
    providerName,
    planName,
    region,
    skipConfirmation,
    version,
    addonOptions,
  };

  if (linkedAppAlias != null) {
    const linkedAppData = await AppConfig.getAppDetails({ alias: linkedAppAlias });
    if (orgaIdOrName != null && linkedAppData.ownerId !== ownerId && format === 'human') {
      Logger.warn('The specified application does not belong to the specified organisation. Ignoring the `--org` option');
    }
    const newAddon = await Addon.create({
      ...addonToCreate,
      ownerId: linkedAppData.ownerId,
    });
    await Addon.link(linkedAppData.ownerId, linkedAppData.appId, { addon_id: newAddon.id });
    displayAddon(format, newAddon, `Add-on created and linked to application ${linkedAppAlias} successfully!`);
  }
  else {
    const newAddon = await Addon.create(addonToCreate);
    displayAddon(format, newAddon, 'Add-on created successfully!');
  }
}

function displayAddon (format, addon, message) {
  switch (format) {

    case 'json': {
      Logger.printJson({
        id: addon.id,
        name: addon.name,
        realId: addon.realId,
      });
      break;
    }

    case 'human':
    default:
      Logger.println([
        message,
        `ID: ${addon.id}`,
        `Real ID: ${addon.realId}`,
      ].join('\n'));
  }
}

async function deleteAddon (params) {
  const { yes: skipConfirmation, org: orgaIdOrName } = params.options;
  const [addon] = params.args;

  const ownerId = await Organisation.getId(orgaIdOrName);
  await Addon.delete(ownerId, addon, skipConfirmation);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully deleted`);
}

async function rename (params) {
  const [addon, newName] = params.args;
  const { org: orgaIdOrName } = params.options;

  const ownerId = await Organisation.getId(orgaIdOrName);
  await Addon.rename(ownerId, addon, newName);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
}

async function listProviders () {

  const providers = await Addon.listProviders();

  const formattedProviders = providers.map((provider) => {
    return [
      colors.bold(provider.id),
      provider.name,
      provider.shortDesc || '',
    ];
  });
  Logger.println(formatTable(formattedProviders));
}

async function showProvider (params) {
  const [providerName] = params.args;

  const provider = await Addon.getProvider(providerName);
  const providerInfos = await Addon.getProviderInfos(providerName);
  const providerPlans = provider.plans.sort((a, b) => a.price - b.price);

  Logger.println(colors.bold(provider.id));
  Logger.println(`${provider.name}: ${provider.shortDesc}`);
  Logger.println();
  Logger.println(`Available regions: ${provider.regions.join(', ')}`);
  Logger.println();
  Logger.println('Available plans');

  providerPlans.forEach((plan) => {
    Logger.println(`Plan ${colors.bold(plan.slug)}`);
    _(plan.features)
      .sortBy('name')
      .forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));

    if (providerInfos != null) {
      const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');
      if (planType != null && planType.value.toLowerCase() === 'dedicated') {
        const planVersions = Object.keys(providerInfos.dedicated);
        const versions = planVersions.map((version) => {
          if (version === providerInfos.defaultDedicatedVersion) {
            return `${version} (default)`;
          }
          else {
            return version;
          }
        });
        Logger.println(`  Available versions: ${versions.join(', ')}`);

        planVersions.forEach((version) => {
          const features = providerInfos.dedicated[version].features;
          Logger.println(`  Options for version ${version}:`);
          features.forEach(({ name, enabled }) => {
            Logger.println(`    ${name}: default=${enabled}`);
          });
        });
      }
    }
  });
}

async function env (params) {

  const { org, format } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveAddonId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const envFromAddon = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);

  switch (format) {

    case 'json': {
      const envFromAddonJson = Object.fromEntries(
        envFromAddon.map(({ name, value }) => [name, value]),
      );
      Logger.println(JSON.stringify(envFromAddonJson, null, 2));
      break;
    }

    case 'shell':
      Logger.println(toNameEqualsValueString(envFromAddon, { addExports: true }));
      break;

    case 'human':
    default:
      Logger.println(toNameEqualsValueString(envFromAddon, { addExports: false }));
  }
}

module.exports = {
  list,
  create,
  delete: deleteAddon,
  rename,
  listProviders,
  showProvider,
  env,
};
