import _ from 'lodash';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { slugify } from '../lib/slugify.js';
import { Logger } from '../logger.js';
import { conf } from './configuration.js';
import * as User from './user.js';

// TODO: Maybe use fs-utils findPath()
export async function loadApplicationConf(ignoreParentConfig = false, pathToFolder) {
  if (pathToFolder == null) {
    pathToFolder = path.dirname(conf.APP_CONFIGURATION_FILE);
  }
  const fileName = path.basename(conf.APP_CONFIGURATION_FILE);
  const fullPath = path.join(pathToFolder, fileName);
  Logger.debug('Loading app configuration from ' + fullPath);
  try {
    const contents = await fs.readFile(fullPath);
    return JSON.parse(contents);
  } catch (error) {
    Logger.info('Cannot load app configuration from ' + conf.APP_CONFIGURATION_FILE + ' (' + error + ')');
    if (ignoreParentConfig || path.parse(pathToFolder).root === pathToFolder) {
      return { apps: [] };
    }
    return loadApplicationConf(ignoreParentConfig, path.normalize(path.join(pathToFolder, '..')));
  }
}

export async function addLinkedApplication(appData, alias, ignoreParentConfig) {
  const currentConfig = await loadApplicationConf(ignoreParentConfig);

  const appEntry = {
    app_id: appData.id,
    org_id: appData.ownerId,
    deploy_url: appData.deployment.httpUrl || appData.deployment.url,
    git_ssh_url: appData.deployment.url,
    name: appData.name,
    alias: alias || slugify(appData.name),
  };

  const isPresent = currentConfig.apps.find((app) => app.app_id === appEntry.app_id) != null;

  // ToDo see what to do when there is a conflict between an existing entry
  // and the entry we want to add (same app_id, different other values)
  if (!isPresent) {
    currentConfig.apps.push(appEntry);
  }

  return persistConfig(currentConfig);
}

export async function removeLinkedApplication({ appId, alias }) {
  const currentConfig = await loadApplicationConf();
  const appToUnlink = currentConfig.apps.find((a) => a.app_id === appId || a.alias === alias);
  if (appToUnlink == null) {
    return false;
  }
  const newConfig = {
    ...currentConfig,
    apps: currentConfig.apps.filter((a) => a !== appToUnlink),
  };

  const isDefault = currentConfig.default === appToUnlink.app_id;
  if (isDefault) {
    delete newConfig.default;
  }

  await persistConfig(newConfig);
  return true;
}

export function findApp(config, alias) {
  if (_.isEmpty(config.apps)) {
    throw new Error('There is no linked or targeted application. Use `--app` option or `clever link` command.');
  }

  if (alias != null) {
    const [appByAlias, secondAppByAlias] = _.filter(config.apps, { alias });
    if (appByAlias == null) {
      throw new Error(`There are no applications matching alias ${alias}`);
    }
    if (secondAppByAlias != null) {
      throw new Error(
        `There are several applications matching alias ${alias}. This should not happen, your \`.clever.json\` should be fixed.`,
      );
    }
    return appByAlias;
  }

  return findDefaultApp(config);
}

export function checkAlreadyLinked(apps, name, alias) {
  const appAliasExists = apps.some((app) => app.alias != null && app.alias === alias);
  if (appAliasExists) {
    throw new Error(`An application is already linked with the alias '${alias}'`);
  }

  const appNameExists = apps.some((app) => app.name === name);
  if (appNameExists) {
    throw new Error(`An application is already linked with the name '${name}'`);
  }
}

function findDefaultApp(config) {
  if (_.isEmpty(config.apps)) {
    throw new Error('There is no linked or targeted application. Use `--app` option or `clever link` command.');
  }

  if (config.default != null) {
    const defaultApp = _.find(config.apps, { app_id: config.default });
    if (defaultApp == null) {
      throw new Error(
        'The default application is not listed anymore. This should not happen, your `.clever.json` should be fixed.',
      );
    }
    return defaultApp;
  }

  if (config.apps.length === 1) {
    return config.apps[0];
  }

  const aliases = _.map(config.apps, 'alias').join(', ');
  throw new Error(
    `Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: ${aliases}`,
  );
}

async function getAppDetailsForId(appId) {
  const config = await loadApplicationConf();

  if (_.isEmpty(config.apps)) {
    throw new Error('There is no linked or targeted application. Use `--app` option or `clever link` command.');
  }

  const [appById, secondAppById] = _.filter(config.apps, { app_id: appId });
  if (appById == null) {
    throw new Error(`There are no applications matching id '${appId}'`);
  }
  if (secondAppById != null) {
    throw new Error(
      `There are several applications matching id '${appId}'.` +
        'This should not happen, your `.clever.json` should be fixed.',
    );
  }

  return appById;
}

export async function getAppDetails({ alias }) {
  const config = await loadApplicationConf();
  const app = findApp(config, alias);
  const ownerId = app.org_id != null ? app.org_id : await User.getCurrentId();
  return {
    appId: app.app_id,
    ownerId: ownerId,
    deployUrl: app.deploy_url,
    name: app.name,
    alias: app.alias,
  };
}

export async function getMostNaturalName(appId) {
  try {
    const details = await getAppDetailsForId(appId);
    return details.alias || details.name || appId;
  } catch {
    return appId;
  }
}

function persistConfig(modifiedConfig) {
  const jsonContents = JSON.stringify(modifiedConfig, null, 2);
  return fs.writeFile(conf.APP_CONFIGURATION_FILE, jsonContents);
}

export async function setDefault(alias) {
  const config = await loadApplicationConf();
  const app = findApp(config, alias);
  const newConfig = { ...config, default: app.app_id };
  return persistConfig(newConfig);
}
