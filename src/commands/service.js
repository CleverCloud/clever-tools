'use strict';

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const Logger = require('../logger.js');

async function list (params) {
  const { alias, 'show-all': showAll, 'only-apps': onlyApps, 'only-addons': onlyAddons } = params.options;
  if (onlyApps && onlyAddons) {
    throw new Error('--only-apps and --only-addons are mutually exclusive');
  }

  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  if (!onlyAddons) {
    const apps = await Application.listDependencies(ownerId, appId, showAll);
    Logger.println('Applications:');
    apps.forEach(({ isLinked, name }) => Logger.println(`${isLinked ? '*' : ' '} ${name}`));
  }

  if (!onlyApps) {
    const addons = await Addon.list(ownerId, appId, showAll);
    Logger.println('Addons:');
    addons.forEach(({ isLinked, name, realId }) => Logger.println(`${isLinked ? '*' : ' '} ${name} (${realId})`));
  }
}

async function linkApp (params) {
  const { alias } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await Application.link(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully linked`);
}

async function unlinkApp (params) {
  const { alias } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await Application.unlink(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully unlinked`);
}

async function linkAddon (params) {
  const { alias } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await Addon.link(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully linked`);
}

async function unlinkAddon (params) {
  const { alias } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await Addon.unlink(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully unlinked`);
}

module.exports = {
  list,
  linkApp,
  unlinkApp,
  linkAddon,
  unlinkAddon,
};
