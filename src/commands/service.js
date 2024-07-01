'use strict';

const Addon = require('../models/addon.js');
const Application = require('../models/application.js');
const Logger = require('../logger.js');

async function list (params) {
  const { alias, app: appIdOrName, 'show-all': showAll, 'only-apps': onlyApps, 'only-addons': onlyAddons, format } = params.options;
  if (onlyApps && onlyAddons) {
    throw new Error('--only-apps and --only-addons are mutually exclusive');
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const formattedServices = {};

  if (!onlyAddons) {
    const apps = await Application.listDependencies(ownerId, appId, showAll);
    formattedServices.applications = apps.map((app) => ({
      id: app.id,
      name: app.name,
      isLinked: app.isLinked,
    }));
  }

  if (!onlyApps) {
    const addons = await Addon.list(ownerId, appId, showAll);
    formattedServices.addons = addons.map((addon) => ({
      id: addon.id,
      realId: addon.realId,
      name: addon.name,
      isLinked: addon.isLinked,
    }));
  }

  switch (format) {
    case 'json': {
      Logger.printJson(formattedServices);
      break;
    }
    case 'human':
    default: {
      if (formattedServices.applications) {
        Logger.println('Applications:');
        formattedServices.applications.forEach(({ isLinked, name }) => Logger.println(`${isLinked ? '*' : ' '} ${name}`));
      }

      if (formattedServices.addons) {
        Logger.println('Addons:');
        formattedServices.addons.forEach(({ isLinked, name, realId }) => Logger.println(`${isLinked ? '*' : ' '} ${name} (${realId})`));
      }
    }
  }
}

async function linkApp (params) {
  const { alias, app: appIdOrName } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Application.link(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully linked`);
}

async function unlinkApp (params) {
  const { alias, app: appIdOrName } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Application.unlink(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully unlinked`);
}

async function linkAddon (params) {
  const { alias, app: appIdOrName } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Addon.link(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully linked`);
}

async function unlinkAddon (params) {
  const { alias, app: appIdOrName } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

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
