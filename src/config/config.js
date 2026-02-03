import path from 'node:path';
import { z } from 'zod';
import { readJsonSync, writeJson } from '../lib/fs.js';
import { Logger } from '../logger.js';
import { getConfigPath } from './paths.js';

const CONFIGURATION_FILE = getConfigPath('clever-tools.json');

const ConfigSchema = z
  .object({
    CONFIGURATION_FILE: z.string(),
    EXPERIMENTAL_FEATURES_FILE: z.string(),
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

    authSource: z.string().default('configuration file'),
    token: z.string().optional(),
    secret: z.string().optional(),
    expirationDate: z.string().optional(),
  })
  .transform((config) => ({
    ...config,
    CONSOLE_TOKEN_URL: config.CONSOLE_TOKEN_URL ?? `${config.CONSOLE_URL}/cli-oauth`,
    GOTO_URL: config.GOTO_URL ?? `${config.CONSOLE_URL}/goto`,
  }));

/**
 * The complete configuration object, loaded synchronously at startup.
 * Priority: environment variables > config file > Zod schema defaults.
 */
export const config = loadConfig();

/**
 * @returns {z.output<typeof ConfigSchema>}
 */
function loadConfig() {
  Logger.debug(`Load configuration from ${CONFIGURATION_FILE}`);
  const configFromFile = readJsonSync(CONFIGURATION_FILE) ?? {};

  /** @type {z.input<typeof ConfigSchema>} */
  const rawConfig = {
    ...configFromFile,
    ...process.env,
    CONFIGURATION_FILE,
    EXPERIMENTAL_FEATURES_FILE: getConfigPath('clever-tools-experimental-features.json'),
  };

  if (process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null) {
    rawConfig.authSource = 'environment variables';
    rawConfig.token = process.env.CLEVER_TOKEN;
    rawConfig.secret = process.env.CLEVER_SECRET;
  }

  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
    Logger.error(`Invalid configuration:\n${errors}`);
    process.exit(1);
  }

  return result.data;
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

/**
 * Writes configuration data to the credentials file.
 * @param {object} data - The data to write (token, secret, expirationDate)
 * @returns {Promise<void>}
 */
export async function updateConfig(data) {
  Logger.debug('Write the tokens in the configuration file…');
  try {
    await writeJson(CONFIGURATION_FILE, data, { mode: 0o700 });
    reloadConfig();
  } catch (error) {
    throw new Error(`Cannot write configuration to ${CONFIGURATION_FILE}\n${error.message}`);
  }
}
