'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Bacon = require('baconjs');
const unidecode = require('unidecode');

const Config = require('./configuration.js');
const Logger = require('../logger.js');

function loadApplicationConf (ignoreParentConfig = false, pathToFolder) {
  if (pathToFolder == null) {
    pathToFolder = path.dirname(Config.APP_CONFIGURATION_FILE);
  }
  const fileName = path.basename(Config.APP_CONFIGURATION_FILE);
  const fullPath = path.join(pathToFolder, fileName);
  Logger.debug('Loading app configuration from ' + fullPath);
  return Bacon.fromNodeCallback(fs.readFile, fullPath)
    .flatMapLatest(Bacon.try(JSON.parse))
    .flatMapError((error) => {
      Logger.info('Cannot load app configuration from ' + Config.APP_CONFIGURATION_FILE + ' (' + error + ')');
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

function getAppData (alias) {
  const currentConfig = loadApplicationConf();

  return currentConfig.flatMap(function (config) {
    const matchingApps = _.filter(config.apps, function (app) {
      const nothingMatches = !alias && !config.default;
      const aliasMatches = alias && app.alias === alias;
      const isDefault = !alias && app.app_id == config.default;
      return nothingMatches || aliasMatches || isDefault;
    });

    if (matchingApps.length === 1) {
      return Bacon.once(matchingApps[0]);
    } else if (matchingApps.length === 0) {
      if (alias) {
        return new Bacon.Error('There are no applications matching this alias');
      } else {
        return new Bacon.Error('There are no applications linked. You can add one with `clever link`');
      }
    } else if (matchingApps.length > 1) {
      return new Bacon.Error('Several applications are linked. You can specify one with the `--alias` option. Run `clever applications` to list linked applications. Available aliases: ' + _.map(matchingApps, 'alias').join(', '));
    }
  });
};

function persistConfig (modifiedConfig) {
  const jsonContents = JSON.stringify(modifiedConfig);
  return Bacon.fromNodeCallback(fs.writeFile, Config.APP_CONFIGURATION_FILE, jsonContents);
};

function setDefault (alias) {
  return loadApplicationConf()
    .flatMap((config) => {
      const app = _.find(config.apps, { alias });
      if (app == null) {
        return new Bacon.Error('There is no application with this alias');
      }
      return _.assign({}, config, { default: app.app_id });
    })
    .flatMapLatest(persistConfig);
}

function slugify (srt) {
  return _.kebabCase(unidecode(srt));
};

module.exports = {
  loadApplicationConf,
  addLinkedApplication,
  removeLinkedApplication,
  getAppData,
  setDefault,
  slugify,
};
