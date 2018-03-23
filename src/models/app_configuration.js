'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Bacon = require('baconjs');
const unidecode = require('unidecode');

const { conf } = require('./configuration.js');
const Logger = require('../logger.js');

function loadApplicationConf (ignoreParentConfig = false, pathToFolder) {
  if (pathToFolder == null) {
    pathToFolder = path.dirname(conf.APP_CONFIGURATION_FILE);
  }
  const fileName = path.basename(conf.APP_CONFIGURATION_FILE);
  const fullPath = path.join(pathToFolder, fileName);
  Logger.debug('Loading app configuration from ' + fullPath);
  return Bacon.fromNodeCallback(fs.readFile, fullPath)
    .flatMapLatest(Bacon.try(JSON.parse))
    .flatMapError((error) => {
      Logger.info('Cannot load app configuration from ' + conf.APP_CONFIGURATION_FILE + ' (' + error + ')');
      if (ignoreParentConfig || path.parse(pathToFolder).root === pathToFolder) {
        return { apps: [] };
      }
      return loadApplicationConf(ignoreParentConfig, path.normalize(path.join(pathToFolder, '..')));
    });
};

function addLinkedApplication (appData, alias, ignoreParentConfig) {
  const currentConfig = loadApplicationConf(ignoreParentConfig);
  const appEntry = {
    app_id: appData.id,
    deploy_url: appData.deployment.httpUrl || appData.deployment.url,
    name: appData.name,
    alias: alias || slugify(appData.name),
  };

  if (appData.ownerId.substr(0, 5) === 'orga_') appEntry.org_id = appData.ownerId;

  const s_newConfig = currentConfig.flatMapLatest(function (config) {
    const isPresent = !_.find(config.apps, function (app) {
      return app.app_id === appEntry.app_id;
    });

    // ToDo see what to do when there is a conflict between an existing entry
    // and the entry we want to add (same app_id, different other values)
    if (isPresent) {
      config.apps.push(appEntry);
    }
    return config;
  });

  return s_newConfig.flatMapLatest(persistConfig);
};

function removeLinkedApplication (alias) {
  const currentConfig = loadApplicationConf();

  const s_newConfig = currentConfig.flatMapLatest(function (config) {
    config.apps = _.reject(config.apps, function (appEntry) {
      return appEntry.alias === alias;
    });
    return config;
  });

  return s_newConfig.flatMapLatest(persistConfig);
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
      throw new Error('The default application is not listed anymore. This should not happen, your \`.clever.json\` should be fixed.');
    }
    return defaultApp;
  }

  if (config.apps.length === 1) {
    return config.apps[0];
  }

  const aliases = _.map(config.apps, 'alias').join(', ');
  throw new Error(`Several applications are linked. You can specify one with the \`--alias\` option. Run \`clever applications\` to list linked applications. Available aliases: ${aliases}`);
}

function getAppData (alias) {
  return loadApplicationConf()
    .flatMap(Bacon.try((config) => findApp(config, alias)));
};

function persistConfig (modifiedConfig) {
  const jsonContents = JSON.stringify(modifiedConfig);
  return Bacon.fromNodeCallback(fs.writeFile, conf.APP_CONFIGURATION_FILE, jsonContents);
};

function setDefault (alias) {
  return loadApplicationConf()
    .flatMap(Bacon.try((config) => {
      const app = findApp(config, alias);
      return _.assign({}, config, { default: app.app_id });
    }))
    .flatMapLatest(persistConfig);
}

function slugify (srt) {
  return _.kebabCase(unidecode(srt));
};

module.exports = {
  loadApplicationConf,
  addLinkedApplication,
  removeLinkedApplication,
  findApp,
  getAppData,
  setDefault,
  slugify,
};
