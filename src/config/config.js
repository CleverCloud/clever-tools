import { createConfigBuilder, InvalidConfigError } from '@clevercloud/reglage';
import path from 'node:path';
import { z } from 'zod';
import { readJsonSync, writeJson } from '../lib/fs.js';
import { Logger } from '../logger.js';
import { getConfigPath } from './paths.js';

const OverridesSchema = z.object({
  API_HOST: z.string().url().optional(),
  CONSOLE_URL: z.string().url().optional(),
  AUTH_BRIDGE_HOST: z.string().url().optional(),
  SSH_GATEWAY: z.string().optional(),
  OAUTH_CONSUMER_KEY: z.string().optional(),
  OAUTH_CONSUMER_SECRET: z.string().optional(),
});

const ProfileSchema = z.object({
  alias: z.string(),
  token: z.string(),
  secret: z.string(),
  expirationDate: z.string().optional(),
  userId: z.string().optional(),
  email: z.string().optional(),
  overrides: OverridesSchema.optional(),
});

/** @typedef {z.infer<typeof ProfileSchema>} Profile */

const LegacyConfigFileSchema = z.object({
  token: z.string(),
  secret: z.string(),
  expirationDate: z.string().optional(),
});

/** @typedef {z.infer<typeof LegacyConfigFileSchema>} LegacyConfigFile */

const ConfigFileSchema = z.object({
  version: z.literal(1),
  profiles: z.array(ProfileSchema).default([]),
});

/** @typedef {z.infer<typeof ConfigFileSchema>} ConfigFile */

const CONFIG_SCHEMA = {
  CONFIGURATION_FILE: {
    schema: z.string().default(getConfigPath('clever-tools.json')),
    documentation: 'Path to the main configuration file',
  },
  EXPERIMENTAL_FEATURES_FILE: {
    schema: z.string().default(getConfigPath('clever-tools-experimental-features.json')),
    documentation: 'Path to the experimental features configuration file',
  },
  APP_CONFIGURATION_FILE: {
    schema: z.string().default(path.resolve('.', '.clever.json')),
    documentation: 'Path to the per-project application configuration file',
  },

  API_HOST: {
    schema: z.url().default('https://api.clever-cloud.com'),
    documentation: 'Clever Cloud API base URL',
  },
  AUTH_BRIDGE_HOST: {
    schema: z.url().default('https://api-bridge.clever-cloud.com'),
    documentation: 'Clever Cloud authentication bridge URL',
  },
  SSH_GATEWAY: {
    schema: z.string().default('ssh@sshgateway-clevercloud-customers.services.clever-cloud.com'),
    documentation: 'SSH gateway address',
  },

  // The disclosure of these tokens is not considered as a vulnerability.
  // Do not report this to our security service.
  OAUTH_CONSUMER_KEY: {
    schema: z.string().default('T5nFjKeHH4AIlEveuGhB5S3xg8T19e'),
    secret: true,
    documentation: 'OAuth consumer key',
  },
  OAUTH_CONSUMER_SECRET: {
    schema: z.string().default('MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT'),
    secret: true,
    documentation: 'OAuth consumer secret',
  },

  API_DOC_URL: {
    schema: z.url().default('https://www.clever.cloud/developers/api'),
    documentation: 'API documentation URL',
  },
  DOC_URL: {
    schema: z.url().default('https://www.clever.cloud/developers/doc'),
    documentation: 'Documentation URL',
  },
  CONSOLE_URL: {
    schema: z.url().default('https://console.clever-cloud.com'),
    documentation: 'Console URL',
  },

  // Default values are computed from `CONSOLE_URL` via a derived source
  CONSOLE_TOKEN_URL: {
    schema: z.url().optional(),
    documentation: 'Console token URL (derived from CONSOLE_URL)',
  },
  GOTO_URL: {
    schema: z.url().optional(),
    documentation: 'Goto URL (derived from CONSOLE_URL)',
  },
};

/** @typedef {import('@clevercloud/reglage').Config<typeof CONFIG_SCHEMA>} ConfigData */

export class BaseConfig {
  /**
   * @param {ConfigData} config
   */
  constructor(config) {
    /** @type {ConfigData} */
    this._config = config;
  }

  /**
   * @param {ConfigData} config
   */
  reload(config) {
    this._config = config;
  }

  /**
   * @template {keyof typeof CONFIG_SCHEMA} K
   * @param {K} key
   * @returns {import('@clevercloud/reglage').InferConfig<typeof CONFIG_SCHEMA>[K]}
   */
  get(key) {
    return this._config.get(key);
  }
}

export class Config extends BaseConfig {
  /**
   * @param {Object} param
   * @param {ConfigData} param.data
   * @param {Profile[]} param.profiles
   */
  constructor({ data, profiles }) {
    super(data);
    /** @type {Profile[]} */
    this._profiles = profiles;
  }

  /**
   * @param {Profile[]} profiles
   */
  reloadProfiles(profiles) {
    this._profiles = profiles;
  }

  /**
   * @returns {Profile[]}
   */
  get profiles() {
    return this._profiles;
  }

  /**
   * @returns {Profile | undefined}
   */
  get activeProfile() {
    return this._profiles[0];
  }
}

/**
 * Base configuration: environment variables + Zod schema defaults, without any profile overrides.
 * Use this as fallback when operating on a specific profile (login, profile list)
 * to avoid being affected by the active profile's overrides.
 */
export const baseConfig = new BaseConfig(loadBaseConfig());

/**
 * @returns {ConfigData}
 */
function loadBaseConfig() {
  return buildConfig([['env', process.env]]);
}

/**
 * The complete configuration object, loaded synchronously at startup.
 * Priority: environment variables > active profile overrides > Zod schema defaults.
 */
export const config = new Config(loadConfig());

/**
 * @returns {{data: ConfigData, profiles: Profile[]}}
 */
function loadConfig() {
  Logger.debug(`Load configuration from ${baseConfig.get('CONFIGURATION_FILE')}`);
  const configFromFile = loadConfigFile();

  // If CLEVER_TOKEN and CLEVER_SECRET are set, inject a virtual "$env" profile as the active one
  /** @type {Profile[]} */
  const profiles =
    process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null
      ? [
          { alias: '$env', token: process.env.CLEVER_TOKEN, secret: process.env.CLEVER_SECRET },
          ...configFromFile.profiles,
        ]
      : configFromFile.profiles;

  const activeProfile = profiles[0];

  const config = buildConfig([
    ['activeProfileOverride', activeProfile?.overrides],
    ['env', process.env],
  ]);

  Logger.debug('Configuration loaded:');
  Logger.debug(config.toString('verbose'));

  return { data: config, profiles };
}

/**
 * Builds a Config from the given sources.
 * Sources are applied in order (later sources override earlier ones).
 * @param {Array<[string, Record<string, unknown> | undefined | null]>} sources
 * @returns {ConfigData}
 */
function buildConfig(sources) {
  const builder = createConfigBuilder(CONFIG_SCHEMA)
    .refine('CONSOLE_TOKEN_URL', (schema, resolved) => {
      if (resolved.CONSOLE_TOKEN_URL == null) {
        return schema.default(`${resolved.CONSOLE_URL}/cli-oauth`);
      }
      return schema;
    })
    .refine('GOTO_URL', (schema, resolved) => {
      if (resolved.GOTO_URL == null) {
        return schema.default(`${resolved.CONSOLE_URL}/goto`);
      }
      return schema;
    });

  for (const [name, values] of sources) {
    if (values != null) {
      builder.addSource(name, values);
    } else {
      Logger.debug(`Skipping source "${name}": no values provided`);
    }
  }

  try {
    return builder.buildConfig();
  } catch (error) {
    if (error instanceof InvalidConfigError) {
      const errors = error.issues
        .map((issue) =>
          issue.source != null
            ? `- ${issue.key} (${issue.source}): ${issue.message}`
            : `- ${issue.key}: ${issue.message}`,
        )
        .join('\n');
      Logger.error(`Invalid configuration:\n${errors}`);
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Reads and parses the config file, handling both current and legacy formats.
 * @returns {ConfigFile}
 */
function loadConfigFile() {
  const data = readJsonSync(baseConfig.get('CONFIGURATION_FILE'));

  // Try parsing as current format
  const result = ConfigFileSchema.safeParse(data);
  if (result.success) {
    Logger.debug('Loaded config file with current format');
    return result.data;
  }

  // Try parsing as legacy format
  const legacyResult = LegacyConfigFileSchema.safeParse(data);
  if (legacyResult.success) {
    Logger.debug('Loaded config file with legacy format, converting to profile');
    const legacyConfig = legacyResult.data;
    return {
      version: 1,
      profiles: [
        {
          alias: 'default',
          token: legacyConfig.token,
          secret: legacyConfig.secret,
          expirationDate: legacyConfig.expirationDate,
        },
      ],
    };
  }

  // No valid config found
  Logger.debug('No valid config file found, using empty config');
  return { version: 1, profiles: [] };
}

/**
 * Saves a profile to the configuration.
 * If a profile with the same alias exists, it is replaced.
 * The saved profile becomes the active profile (first in the list).
 * @param {Profile} profile
 * @returns {Promise<void>}
 */
export async function saveProfile(profile) {
  const configFile = loadConfigFile();
  const otherProfiles = configFile.profiles.filter((p) => p.alias !== profile.alias);
  // Always put the active profile in the first position
  configFile.profiles = [profile, ...otherProfiles];
  await updateConfigFile(configFile);
}

/**
 * Removes a profile by alias and returns the new active profile (if any).
 * @param {string} alias
 * @returns {Promise<Profile | null>}
 */
export async function removeProfile(alias) {
  const configFile = loadConfigFile();
  configFile.profiles = configFile.profiles.filter((p) => p.alias !== alias);
  await updateConfigFile(configFile);
  return configFile.profiles[0] ?? null;
}

/**
 * Writes the configuration to the config file and reloads the in-memory config.
 * @param {ConfigFile} newConfig - The new configuration to persist
 * @returns {Promise<void>}
 */
async function updateConfigFile(newConfig) {
  Logger.debug('Write the new config in the configuration file…');
  try {
    await writeJson(baseConfig.get('CONFIGURATION_FILE'), newConfig, { mode: 0o700 });
    reloadConfig();
  } catch (error) {
    throw new Error(`Cannot write configuration to ${baseConfig.get('CONFIGURATION_FILE')}\n${error.message}`);
  }
}

/**
 * Reloads the configuration from file and updates the config object in place.
 * This ensures all modules referencing the config object see the updated values.
 */
export function reloadConfig() {
  const { data, profiles } = loadConfig();
  config.reload(data);
  config.reloadProfiles(profiles);
}
