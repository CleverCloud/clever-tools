'use strict';

const Logger = require('../logger.js');

const CONFIG_KEYS = [
  { id: 'name', name: 'name', displayName: 'Name', kind: 'string' },
  { id: 'description', name: 'description', displayName: 'Description', kind: 'string' },
  { id: 'zero-downtime', name: 'homogeneous', displayName: 'Zero-downtime deployment', kind: 'inverted-bool' },
  { id: 'sticky-sessions', name: 'stickySessions', displayName: 'Sticky sessions', kind: 'bool' },
  { id: 'cancel-on-push', name: 'cancelOnPush', displayName: 'Cancel current deployment on push', kind: 'bool' },
];

function listAvailableIds () {
  return CONFIG_KEYS.map((config) => config.id);
}

function getById (id) {
  const config = CONFIG_KEYS.find((config) => config.id === id);
  if (config == null) {
    Logger.error(`Invalid configuration name: ${id}.`);
    Logger.error(`Available configuration names are: ${listAvailableIds().join(', ')}.`);
  }
  return config;
}

function display (config, value) {
  switch (config.kind) {
    case 'bool': {
      return (value) ? 'enabled' : 'disabled';
    }
    case 'inverted-bool': {
      return (value) ? 'disabled' : 'enabled';
    }
    default: {
      return String(value);
    }
  }
}

function parse (config, value) {
  switch (config.kind) {
    case 'bool': {
      return (value !== 'false');
    }
    case 'inverted-bool': {
      return (value === 'false');
    }
    default: {
      return value;
    }
  }
}

function printConfig (app, config) {
  if (app[config.name] != null) {
    Logger.println(`${config.displayName}: ${display(config, app[config.name])}`);
  }
}

function printById (app, id) {
  const config = getById(id);
  if (config != null) {
    printConfig(app, config);
  }
}

function print (app) {
  for (const config of CONFIG_KEYS) {
    printConfig(app, config);
  }
}

module.exports = { listAvailableIds, getById, parse, printById, print };
