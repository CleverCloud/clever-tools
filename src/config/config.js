import path from 'node:path';
import { z } from 'zod';
import { getConfigPath } from './paths.js';

/**
 * Configuration schema with default values.
 * Each value can be overridden by setting an environment variable with the same name.
 */
const CleverToolsConfigSchema = z.object({
  API_HOST: z.url().default('https://api.clever-cloud.com'),
  AUTH_BRIDGE_HOST: z.url().default('https://api-bridge.clever-cloud.com'),
  SSH_GATEWAY: z.string().default('ssh@sshgateway-clevercloud-customers.services.clever-cloud.com'),

  // The disclosure of these tokens is not considered as a vulnerability.
  // Do not report this to our security service.
  OAUTH_CONSUMER_KEY: z.string().default('T5nFjKeHH4AIlEveuGhB5S3xg8T19e'),
  OAUTH_CONSUMER_SECRET: z.string().default('MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT'),

  APP_CONFIGURATION_FILE: z.string().default(path.resolve('.', '.clever.json')),
  CONFIGURATION_FILE: z.string().default(getConfigPath('clever-tools.json')),
  EXPERIMENTAL_FEATURES_FILE: z.string().default(getConfigPath('clever-tools-experimental-features.json')),

  API_DOC_URL: z.url().default('https://www.clever.cloud/developers/api'),
  DOC_URL: z.url().default('https://www.clever.cloud/developers/doc'),
  CONSOLE_URL: z.url().default('https://console.clever-cloud.com'),
  CONSOLE_TOKEN_URL: z.url().default('https://console.clever-cloud.com/cli-oauth'),
  GOTO_URL: z.url().default('https://console.clever-cloud.com/goto'),
});

/**
 * Configuration with environment variable overrides applied.
 */
function loadConfig() {
  const result = CleverToolsConfigSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${errors}`);
  }
  return result.data;
}

export const conf = loadConfig();
