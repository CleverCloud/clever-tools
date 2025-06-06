import cliparse from 'cliparse';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import dedent from 'dedent';

const CONFIG_KEYS = [
  { id: 'name', name: 'name', displayName: 'Name', kind: 'string' },
  { id: 'description', name: 'description', displayName: 'Description', kind: 'string' },
  { id: 'zero-downtime', name: 'homogeneous', displayName: 'Zero-downtime deployment', kind: 'inverted-bool' },
  { id: 'sticky-sessions', name: 'stickySessions', displayName: 'Sticky sessions', kind: 'bool' },
  { id: 'cancel-on-push', name: 'cancelOnPush', displayName: 'Cancel current deployment on push', kind: 'bool' },
  { id: 'force-https', name: 'forceHttps', displayName: 'Force redirection of HTTP to HTTPS', kind: 'force-https' },
];

export function listAvailableIds () {
  return CONFIG_KEYS.map((config) => config.id);
}

export function getById (id) {
  const config = CONFIG_KEYS.find((config) => config.id === id);
  if (config != null) {
    return config;
  }
  throw new Error(dedent`
    Invalid configuration name: ${id}.
    Available configuration names are: ${listAvailableIds().join(', ')}.
  `);
}

function display (config, value) {
  switch (config.kind) {
    case 'bool': {
      return (value) ? 'enabled' : 'disabled';
    }
    case 'inverted-bool': {
      return (value) ? 'disabled' : 'enabled';
    }
    case 'force-https': {
      return value.toLowerCase();
    }
    default: {
      return String(value);
    }
  }
}

export function parse (config, value) {
  switch (config.kind) {
    case 'bool':
    case 'inverted-bool':
    case 'force-https': {
      if (value !== 'true' && value !== 'false') {
        throw new Error('Invalid configuration value, it must be a boolean (true or false)');
      }
      if (config.kind === 'bool') {
        return (value === 'true');
      }
      if (config.kind === 'inverted-bool') {
        return (value === 'false');
      }
      if (config.kind === 'force-https') {
        return (value === 'true') ? 'ENABLED' : 'DISABLED';
      }
      return;
    }
    default: {
      return value;
    }
  }
}

export function getUpdateOptions () {
  return CONFIG_KEYS
    .map((config) => getConfigOptions(config))
    .reduce((a, b) => [...a, ...b], []);
}

function getConfigOptions (config) {
  switch (config.kind) {
    case 'bool':
    case 'inverted-bool':
    case 'force-https': {
      return [
        cliparse.flag(`enable-${config.id}`, { description: `Enable ${config.id}` }),
        cliparse.flag(`disable-${config.id}`, { description: `Disable ${config.id}` }),
      ];
    }
    default: {
      return [
        cliparse.option(`${config.id}`, { description: `Set ${config.id}` }),
      ];
    }
  }
}

export function parseOptions (options) {
  const newOptions = CONFIG_KEYS
    .map((config) => parseConfigOption(config, options))
    .filter((a) => a != null);
  return Object.fromEntries(newOptions);
}

function parseConfigOption (config, options) {
  switch (config.kind) {
    case 'bool': {
      const enable = options[`enable-${config.id}`];
      const disable = options[`disable-${config.id}`];
      if (enable && disable) {
        Logger.warn(`${config.id} is both enabled and disabled, ignoring`);
      }
      else if (enable || disable) {
        return [config.name, enable];
      }
      return null;
    }
    case 'inverted-bool': {
      const disable = options[`enable-${config.id}`];
      const enable = options[`disable-${config.id}`];
      if (enable && disable) {
        Logger.warn(`${config.id} is both enabled and disabled, ignoring`);
      }
      else if (enable || disable) {
        return [config.name, enable];
      }
      return null;
    }
    case 'force-https': {
      const enable = options[`enable-${config.id}`];
      const disable = options[`disable-${config.id}`];
      if (enable && disable) {
        Logger.warn(`${config.id} is both enabled and disabled, ignoring`);
      }
      else if (enable || disable) {
        const value = (enable) ? 'ENABLED' : 'DISABLED';
        return [config.name, value];
      }
      return null;
    }
    default: {
      if (options[config.id] !== null) {
        return [config.name, options[config.id]];
      }
      return null;
    }
  }
}

function printConfig (app, config) {
  if (app[config.name] != null) {
    Logger.println(`${config.displayName}: ${colors.bold(display(config, app[config.name]))}`);
  }
}

export function printById (app, id) {
  const config = getById(id);
  printConfig(app, config);
}

export function printByName (app, name) {
  const config = CONFIG_KEYS.find((config) => config.name === name);
  printConfig(app, config);
}

export function print (app) {
  for (const config of CONFIG_KEYS) {
    printConfig(app, config);
  }
}
