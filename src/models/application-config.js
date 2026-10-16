import dedent from 'dedent';
import { Logger } from '../logger.js';

const CONFIG_KEYS = [
  { id: 'name', name: 'name', displayName: 'Name', kind: 'string' },
  { id: 'description', name: 'description', displayName: 'Description', kind: 'string' },
  { id: 'zero-downtime', name: 'homogeneous', displayName: 'Zero-downtime deployment', kind: 'inverted-bool' },
  { id: 'sticky-sessions', name: 'stickySessions', displayName: 'Sticky sessions', kind: 'bool' },
  { id: 'cancel-on-push', name: 'cancelOnPush', displayName: 'Cancel current deployment on push', kind: 'bool' },
  { id: 'force-https', name: 'forceHttps', displayName: 'Force redirection of HTTP to HTTPS', kind: 'force-https' },
  { id: 'task', name: 'instanceLifetime', displayName: 'Deploy an application as a Clever Task', kind: 'task' },
];

export function listAvailableIds(asText = false) {
  const ids = CONFIG_KEYS.map((configKey) => configKey.id);
  if (asText) {
    return new Intl.ListFormat('en', { style: 'short', type: 'disjunction' }).format(ids);
  }
  return ids;
}

export function getById(id) {
  const configKey = CONFIG_KEYS.find((ck) => ck.id === id);
  if (configKey != null) {
    return configKey;
  }
  throw new Error(dedent`
    Invalid configuration name: ${id}.
    Available configuration names: ${listAvailableIds(true)}.
  `);
}

export function formatValue(configKey, value) {
  switch (configKey.kind) {
    case 'bool': {
      return value;
    }
    case 'inverted-bool': {
      return !value;
    }
    case 'force-https': {
      return value === 'ENABLED';
    }
    case 'task': {
      return value === 'TASK';
    }
    default: {
      return String(value);
    }
  }
}

export function parse(configKey, value) {
  switch (configKey.kind) {
    case 'bool':
    case 'inverted-bool':
    case 'force-https':
    case 'task': {
      if (value !== 'true' && value !== 'false') {
        throw new Error('Invalid configuration value, it must be a boolean (true or false)');
      }
      if (configKey.kind === 'bool') {
        return value === 'true';
      }
      if (configKey.kind === 'inverted-bool') {
        return value === 'false';
      }
      if (configKey.kind === 'force-https') {
        return value === 'true' ? 'ENABLED' : 'DISABLED';
      }
      if (configKey.kind === 'task') {
        return value === 'false' ? 'REGULAR' : 'TASK';
      }
      return;
    }
    default: {
      return value;
    }
  }
}

export function parseOptions(options) {
  const newOptions = CONFIG_KEYS.map((configKey) => {
    return parseConfigOption(configKey, options);
  }).filter((a) => {
    return a != null && a[1] != null;
  });
  return Object.fromEntries(newOptions);
}

function parseConfigOption(configKey, options) {
  switch (configKey.kind) {
    case 'bool':
    case 'inverted-bool':
    case 'force-https':
    case 'task': {
      const enable = options[`enable-${configKey.id}`];
      const disable = options[`disable-${configKey.id}`];
      if (enable && disable) {
        throw new Error(`You cannot use both --enable-${configKey.id} and --disable-${configKey.id} at the same time`);
      }
      if (enable || disable) {
        if (configKey.kind === 'bool') {
          return [configKey.name, enable];
        }
        if (configKey.kind === 'inverted-bool') {
          return [configKey.name, disable];
        }
        if (configKey.kind === 'force-https' || configKey.kind === 'task') {
          return [configKey.name, parse(configKey, String(enable))];
        }
      }
      return;
    }
    default: {
      return [configKey.name, options[configKey.id]];
    }
  }
}

export function printValue(app, id) {
  const configKey = getById(id);
  Logger.println(formatValue(configKey, app[configKey.name]));
}

export function printAllValues(app) {
  console.table(
    Object.fromEntries(
      CONFIG_KEYS.map((configKey) => {
        return [configKey.id, formatValue(configKey, app[configKey.name])];
      }),
    ),
  );
}
