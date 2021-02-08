'use strict';

const _ = require('lodash');
const colors = require('colors/safe');

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const formatTable = require('../format-table')();
const Logger = require('../logger.js');
const Organisation = require('../models/organisation.js');
const User = require('../models/user.js');

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
  const { link: linkedAppAlias, plan: planName, region, yes: skipConfirmation, org: orgaIdOrName } = params.options;

  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  if (linkedAppAlias != null) {
    const linkedAppData = await AppConfig.getAppDetails({ alias: linkedAppAlias });
    if (orgaIdOrName != null && linkedAppData.ownerId !== ownerId) {
      Logger.warn('The specified application does not belong to the specified organisation. Ignoring the `--org` option');
    }
    const newAddon = await Addon.create({
      ownerId: linkedAppData.ownerId,
      name,
      providerName,
      planName,
      region,
      skipConfirmation,
    });
    await Addon.link(linkedAppData.ownerId, linkedAppData.appId, { addon_id: newAddon.id });
    Logger.println(`Addon ${name} (id: ${newAddon.id}) successfully created and linked to the application`);
  }
  else {
    const newAddon = await Addon.create({ ownerId, name, providerName, planName, region, skipConfirmation });
    Logger.println(`Addon ${name} (id: ${newAddon.id}) successfully created`);
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

  Logger.println(colors.bold(provider.id));
  Logger.println(`${provider.name}: ${provider.shortDesc}`);
  Logger.println();
  Logger.println(`Available regions: ${provider.regions.join(', ')}`);
  Logger.println();
  Logger.println('Available plans');

  provider.plans.forEach((plan) => {
    Logger.println(`Plan ${colors.bold(plan.slug)}`);
    _(plan.features)
      .sortBy('name')
      .forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));
  });
}

module.exports = {
  list,
  create,
  delete: deleteAddon,
  rename,
  listProviders,
  showProvider,
};
