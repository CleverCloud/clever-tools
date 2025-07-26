import { styleText } from 'node:util';
import { Logger } from '../logger.js';
import * as Addon from '../models/addon.js';
import * as Application from '../models/application.js';

export async function list(params) {
  const {
    alias,
    app: appIdOrName,
    'show-all': showAll,
    'only-apps': onlyApps,
    'only-addons': onlyAddons,
    format,
  } = params.options;
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
      const { applications = [], addons = [] } = formattedServices;

      if (applications.length === 0 && addons.length === 0) {
        Logger.printInfo(
          `No linked services found, use ${styleText('blue', 'clever service link-app')} or ${styleText('blue', 'clever service link-addon')} to link services to an application`,
        );
        return;
      }

      if (applications.length > 0) {
        Logger.println('Applications:');
        applications.forEach(({ isLinked, name }) => Logger.println(`${isLinked ? '*' : ' '} ${name}`));
      }

      if (addons.length > 0) {
        Logger.println('Addons:');
        addons.forEach(({ isLinked, name, realId }) => Logger.println(`${isLinked ? '*' : ' '} ${name} (${realId})`));
      }
    }
  }
}

export async function linkApp(params) {
  const { alias, app: appIdOrName } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Application.link(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully linked`);
}

export async function unlinkApp(params) {
  const { alias, app: appIdOrName } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Application.unlink(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully unlinked`);
}

export async function linkAddon(params) {
  const { alias, app: appIdOrName } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Addon.link(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully linked`);
}

export async function unlinkAddon(params) {
  const { alias, app: appIdOrName } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Addon.unlink(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully unlinked`);
}
