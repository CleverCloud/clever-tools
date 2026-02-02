import _ from 'lodash';
import path from 'node:path';
import { readJson, writeJson } from '../lib/fs.js';
import { slugify } from '../lib/slugify.js';
import { styleText } from '../lib/style-text.js';
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
    return await readJson(fullPath);
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

  const generatedAlias = alias || slugify(appData.name);

  const existingApp = currentConfig.apps.find((app) => app.app_id === appData.id);
  if (existingApp != null) {
    throw new Error(
      `Application ${styleText('red', appData.id)} is already linked with alias ${styleText('red', existingApp.alias)}`,
    );
  }

  const aliasConflict = currentConfig.apps.find((app) => app.alias === generatedAlias);
  if (aliasConflict != null) {
    throw new Error(
      `An application with alias ${styleText('red', generatedAlias)} is already linked. Please specify a different alias with ${styleText('blue', '--alias')}.`,
    );
  }

  const appEntry = {
    app_id: appData.id,
    org_id: appData.ownerId,
    deploy_url: appData.deployment.httpUrl || appData.deployment.url,
    git_ssh_url: appData.deployment.url,
    name: appData.name,
    alias: generatedAlias,
  };

  currentConfig.apps.push(appEntry);

  return writeJson(conf.APP_CONFIGURATION_FILE, currentConfig).then(() => {
    return appEntry;
  });
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

  await writeJson(conf.APP_CONFIGURATION_FILE, newConfig);
  return true;
}

export function findApp(appConfig, alias) {
  if (_.isEmpty(appConfig.apps)) {
    throw new Error('There is no linked or targeted application. Use `--app` option or `clever link` command.');
  }

  if (alias != null) {
    const [appByAlias, secondAppByAlias] = _.filter(appConfig.apps, { alias });
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

  return findDefaultApp(appConfig);
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

function findDefaultApp(appConfig) {
  if (_.isEmpty(appConfig.apps)) {
    throw new Error('There is no linked or targeted application. Use `--app` option or `clever link` command.');
  }

  if (appConfig.default != null) {
    const defaultApp = _.find(appConfig.apps, { app_id: appConfig.default });
    if (defaultApp == null) {
      throw new Error(
        'The default application is not listed anymore. This should not happen, your `.clever.json` should be fixed.',
      );
    }
    return defaultApp;
  }

  if (appConfig.apps.length === 1) {
    return appConfig.apps[0];
  }

  const aliases = _.map(appConfig.apps, 'alias').join(', ');
  throw new Error(
    `Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: ${aliases}`,
  );
}

export async function getAppDetails({ alias }) {
  const appConfig = await loadApplicationConf();
  const app = findApp(appConfig, alias);
  const ownerId = app.org_id != null ? app.org_id : await User.getCurrentId();
  return {
    appId: app.app_id,
    ownerId: ownerId,
    deployUrl: app.deploy_url,
    name: app.name,
    alias: app.alias,
  };
}

export async function setDefault(alias) {
  const appConfig = await loadApplicationConf();
  const app = findApp(appConfig, alias);
  const newConfig = { ...appConfig, default: app.app_id };
  return writeJson(conf.APP_CONFIGURATION_FILE, newConfig);
}
