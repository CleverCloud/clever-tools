'use strict';

const { promises: fs } = require('fs');
const path = require('path');

const _ = require('lodash');
const slugify = require('slugify');

const Logger = require('../logger.js');
const User = require('./user.js');
const { conf } = require('./configuration.js');

// TODO: Maybe use fs-utils findPath()
async function loadApplicationConf (ignoreParentConfig = false, pathToFolder) {
  if (pathToFolder == null) {
    pathToFolder = path.dirname(conf.APP_CONFIGURATION_FILE);
  }
  const fileName = path.basename(conf.APP_CONFIGURATION_FILE);
  const fullPath = path.join(pathToFolder, fileName);
  Logger.debug('Loading app configuration from ' + fullPath);
  try {
    const contents = await fs.readFile(fullPath);
    return JSON.parse(contents);
  }
  catch (error) {
    Logger.info('Cannot load app configuration from ' + conf.APP_CONFIGURATION_FILE + ' (' + error + ')');
    if (ignoreParentConfig || path.parse(pathToFolder).root === pathToFolder) {
      return { apps: [] };
    }
    return loadApplicationConf(ignoreParentConfig, path.normalize(path.join(pathToFolder, '..')));
  }
};

async function addLinkedApplication (appData, alias, ignoreParentConfig) {
  const currentConfig = await loadApplicationConf(ignoreParentConfig);

  const appEntry = {
    app_id: appData.id,
    org_id: appData.ownerId,
    deploy_url: appData.deployment.httpUrl || appData.deployment.url,
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
};

async function removeLinkedApplication (alias) {
  const currentConfig = await loadApplicationConf();
  const newConfig = {
    ...currentConfig,
    apps: currentConfig.apps.filter((appEntry) => appEntry.alias !== alias),
  };
  return persistConfig(newConfig);
};

function findApp (config, alias) {

  if (_.isEmpty(config.apps)) {
    throw new Error('There are no applications linked. You can add one with `clever link`');
  }

  if (alias != null) {
    const [appByAlias, secondAppByAlias] = _.filter(config.apps, { alias });
    if (appByAlias == null) {
      throw new Error(`There are no applications matching alias ${alias}`);
    }
    if (secondAppByAlias != null) {
      throw new Error(`There are several applications matching alias ${alias}. This should not happen, your \`.clever.json\` should be fixed.`);
    }
    return appByAlias;
  }

  if (config.default != null) {
    const defaultApp = _.find(config.apps, { app_id: config.default });
    if (defaultApp == null) {
      throw new Error('The default application is not listed anymore. This should not happen, your `.clever.json` should be fixed.');
    }
    return defaultApp;
  }

  if (config.apps.length === 1) {
    return config.apps[0];
  }

  const aliases = _.map(config.apps, 'alias').join(', ');
  throw new Error(`Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: ${aliases}`);
}

async function getAppDetails ({ alias }) {
  const config = await loadApplicationConf();
  const app = findApp(config, alias);
  const ownerId = (app.org_id != null)
    ? app.org_id
    : await User.getCurrentId();
  return {
    appId: app.app_id,
    ownerId: ownerId,
    deployUrl: app.deploy_url,
    name: app.name,
    alias: app.alias,
  };
};

function persistConfig (modifiedConfig) {
  const jsonContents = JSON.stringify(modifiedConfig);
  return fs.writeFile(conf.APP_CONFIGURATION_FILE, jsonContents);
};

async function setDefault (alias) {
  const config = await loadApplicationConf();
  const app = findApp(config, alias);
  const newConfig = { ...config, default: app.app_id };
  return persistConfig(newConfig);
}

module.exports = {
  loadApplicationConf,
  addLinkedApplication,
  removeLinkedApplication,
  findApp,
  getAppDetails,
  setDefault,
};
