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

const ConfigSchema = z
  .object({
    CONFIGURATION_FILE: z.string().default(getConfigPath('clever-tools.json')),
    EXPERIMENTAL_FEATURES_FILE: z.string().default(getConfigPath('clever-tools-experimental-features.json')),
    APP_CONFIGURATION_FILE: z.string().default(() => path.resolve('.', '.clever.json')),

    API_HOST: z.url().default('https://api.clever-cloud.com'),
    AUTH_BRIDGE_HOST: z.url().default('https://api-bridge.clever-cloud.com'),
    SSH_GATEWAY: z.string().default('ssh@sshgateway-clevercloud-customers.services.clever-cloud.com'),

    // The disclosure of these tokens is not considered as a vulnerability.
    // Do not report this to our security service.
    OAUTH_CONSUMER_KEY: z.string().default('T5nFjKeHH4AIlEveuGhB5S3xg8T19e'),
    OAUTH_CONSUMER_SECRET: z.string().default('MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT'),

    API_DOC_URL: z.url().default('https://www.clever.cloud/developers/api'),
    DOC_URL: z.url().default('https://www.clever.cloud/developers/doc'),
    CONSOLE_URL: z.url().default('https://console.clever-cloud.com'),

    // Default values are computed from `CONSOLE_URL` below
    CONSOLE_TOKEN_URL: z.url().optional(),
    GOTO_URL: z.url().optional(),

    token: z.string().optional(),
    secret: z.string().optional(),
    expirationDate: z.string().optional(),
    profiles: z.array(ProfileSchema).default([]),
  })
  .transform((config) => ({
    ...config,
    CONSOLE_TOKEN_URL: config.CONSOLE_TOKEN_URL ?? `${config.CONSOLE_URL}/cli-oauth`,
    GOTO_URL: config.GOTO_URL ?? `${config.CONSOLE_URL}/goto`,
  }));

/**
 * Base configuration: environment variables + Zod schema defaults, without any profile overrides.
 * Use this as fallback when operating on a specific profile (login, profile list)
 * to avoid being affected by the active profile's overrides.
 */
export const baseConfig = loadBaseConfig();

/**
 * @returns {z.output<typeof ConfigSchema>}
 */
function loadBaseConfig() {
  const result = ConfigSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
    Logger.error(`Invalid configuration:\n${errors}`);
    process.exit(1);
  }

  return result.data;
}

/**
 * The complete configuration object, loaded synchronously at startup.
 * Priority: environment variables > active profile overrides > Zod schema defaults.
 */
export const config = loadConfig();

/**
 * @returns {z.output<typeof ConfigSchema>}
 */
function loadConfig() {
  Logger.debug(`Load configuration from ${baseConfig.CONFIGURATION_FILE}`);
  const configFromFile = loadConfigFile();

  // If CLEVER_TOKEN and CLEVER_SECRET are set, inject a virtual "$env" profile as the active one
  const profiles =
    process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null
      ? [
          { alias: '$env', token: process.env.CLEVER_TOKEN, secret: process.env.CLEVER_SECRET },
          ...configFromFile.profiles,
        ]
      : configFromFile.profiles;

  const activeProfile = profiles[0];

  /** @type {z.input<typeof ConfigSchema>} */
  const rawConfig = {
    ...activeProfile,
    // Profile overrides (e.g. custom API_HOST) applied after profile auth data, before env vars
    ...activeProfile?.overrides,
    profiles,
    ...process.env,
  };

  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
    Logger.error(`Invalid configuration:\n${errors}`);
    process.exit(1);
  }

  return result.data;
}

/**
 * Reads and parses the config file, handling both current and legacy formats.
 * @returns {ConfigFile}
 */
function loadConfigFile() {
  const data = readJsonSync(baseConfig.CONFIGURATION_FILE);

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
    await writeJson(baseConfig.CONFIGURATION_FILE, newConfig, { mode: 0o600 });
    reloadConfig();
  } catch (error) {
    throw new Error(`Cannot write configuration to ${baseConfig.CONFIGURATION_FILE}\n${error.message}`);
  }
}

/**
 * Reloads the configuration from file and updates the config object in place.
 * This ensures all modules referencing the config object see the updated values.
 */
export function reloadConfig() {
  const mutableConfig = /** @type {Record<string, unknown>} */ (config);
  for (const key of Object.keys(mutableConfig)) {
    delete mutableConfig[key];
  }
  const newConfig = loadConfig();
  Object.assign(config, newConfig);
}
