import { z } from 'zod';
import { Logger } from '../logger.js';
import { conf } from './config.js';
import { readJson, writeJson } from './paths.js';

const OAuthConfigSchema = z.object({
  token: z.string(),
  secret: z.string(),
  expirationDate: z.string().optional(),
});

/** @typedef {z.infer<typeof OAuthConfigSchema>} OAuthConfig */

/**
 * Loads OAuth credentials from environment variables or configuration file.
 * Environment variables CLEVER_TOKEN and CLEVER_SECRET take precedence over the configuration file.
 * @returns {Promise<{source: string, token?: string, secret?: string}>} OAuth configuration with source indicator
 */
export async function loadOAuthConf() {
  Logger.debug('Load configuration from environment variables');
  if (process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null) {
    return {
      source: 'environment variables',
      token: process.env.CLEVER_TOKEN,
      secret: process.env.CLEVER_SECRET,
    };
  }

  Logger.debug('Load configuration from ' + conf.CONFIGURATION_FILE);
  try {
    const json = await readJson(conf.CONFIGURATION_FILE);
    const parsed = OAuthConfigSchema.safeParse(json);
    if (!parsed.success) {
      Logger.info(`Invalid OAuth configuration format in ${conf.CONFIGURATION_FILE}`);
      return { source: 'none' };
    }
    return {
      source: 'configuration file',
      token: parsed.data.token,
      secret: parsed.data.secret,
    };
  } catch (error) {
    Logger.info(`Cannot load configuration from ${conf.CONFIGURATION_FILE}\n${error.message}`);
    return {
      source: 'none',
    };
  }
}

/**
 * Writes OAuth credentials to the configuration file.
 * Creates the configuration directory if it doesn't exist.
 * @param {OAuthConfig} oauthData - The OAuth data to write
 * @returns {Promise<void>}
 * @throws {Error} If the configuration file cannot be written
 */
export async function writeOAuthConf(oauthData) {
  Logger.debug('Write the tokens in the configuration file…');
  try {
    await writeJson(conf.CONFIGURATION_FILE, oauthData);
  } catch (error) {
    throw new Error(`Cannot write configuration to ${conf.CONFIGURATION_FILE}\n${error.message}`);
  }
}
