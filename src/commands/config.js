'use strict';

const application = require('@clevercloud/client/cjs/api/application.js');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const Logger = require('../logger.js');

const { sendToApi } = require('../models/send-to-api.js');

const CONFIG_KEYS = [
  { id: 'name', name: 'name', displayName: 'Name' },
  { id: 'description', name: 'description', displayName: 'Description' },
  { id: 'zero-downtime', name: 'homogeneous', displayName: 'Zero-downtime deployment', displayer: zeroDowntimeDisplayer, parser: zeroDowntimeParser },
  { id: 'sticky-sessions', name: 'stickySessions', displayName: 'Sticky sessions', displayer: booleanDisplayer, parser: booleanParser },
  { id: 'cancel-on-push', name: 'cancelOnPush', displayName: 'Cancel current deployment on push', displayer: booleanDisplayer, parser: booleanParser },
];

function listAvailableConfigurations () {
  return CONFIG_KEYS.map((config) => config.id);
}

function getConfigById (id) {
  const config = CONFIG_KEYS.find((config) => config.id === id);
  if (config == null) {
    Logger.error(`Invalid configuration name: ${id}.`);
    Logger.error(`Available configuration names are: ${listAvailableConfigurations().join(', ')}.`);
  }
  return config;
}

function zeroDowntimeDisplayer (homogeneous) {
  return booleanDisplayer(!homogeneous);
}

function booleanDisplayer (value) {
  return (value) ? 'enabled' : 'disabled';
}

function defaultDisplayer (value) {
  return `${value}`;
}

function zeroDowntimeParser (value) {
  return !booleanParser(value);
}

function booleanParser (value) {
  return (value !== 'false');
}

function identity (value) {
  return value;
}

function printConfig (app, config) {
  if (app[config.name] != null) {
    const displayer = config.displayer || defaultDisplayer;
    Logger.println(`${config.displayName}: ${displayer(app[config.name])}`);
  }
}

function printConfiguration (app, configurationName) {
  if (configurationName == null) {
    for (const config of CONFIG_KEYS) {
      printConfig(app, config);
    }
  }
  else {
    const config = getConfigById(configurationName);
    if (config != null) {
      printConfig(app, config);
    }
  }
}

async function get (params) {
  const [configurationName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const app = await Application.get(ownerId, appId);

  printConfiguration(app, configurationName);
}

async function set (params) {
  const [configurationName, configurationValue] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const config = getConfigById(configurationName);

  if (config !== undefined) {
    const parser = config.parser || identity;
    const app = await application.update({ id: ownerId, appId }, { [config.name]: parser(configurationValue) }).then(sendToApi);

    printConfiguration(app, configurationName);
  }
}

module.exports = { listAvailableConfigurations, get, set };
