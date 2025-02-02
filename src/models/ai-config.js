import fs from 'node:fs';
import colors from 'colors/safe.js';

import * as AiProviders from '../models/ai-providers.js';

import { Logger } from '../logger.js';
import { PROVIDERS } from '../ai-consts.js';
import { maskToken } from '../models/utils.js';
import { confirm, input, password, select } from '@inquirer/prompts';

// TODO: Check we don't use base_url for non Ollama providers
const DEFAULT_CONFIG_FILE = '.clever-ai-chat.json';

/**
 * Get configuration from a file
 * @param {string} filePath - The path to the configuration file
 * @returns {Promise<Object>} - The configuration
 * @public
 */
export async function getConfigurationFromFile (filePath = DEFAULT_CONFIG_FILE) {
  filePath = filePath ?? DEFAULT_CONFIG_FILE;

  // We don't throw an error if the file doesn't exist, the user will enter the configuration manually
  if (!fs.existsSync(filePath)) {
    Logger.debug(`Configuration file ${filePath} not found`);
    return null;
  }

  try {
    const config = fs.readFileSync(filePath, 'utf8');
    const parsedConfig = JSON.parse(config);

    // We copy each llm_configuration.name to llm_configuration.provider
    parsedConfig.llm_configurations = parsedConfig.llm_configurations.map((llmConfiguration) => ({
      ...llmConfiguration,
      provider: llmConfiguration.name,
    }));

    return replaceEnvTokens(parsedConfig);
  }
  catch (error) {
    Logger.error(`Error parsing configuration file ${colors.red(filePath)}: ${error}`);
    process.exit(1);
  }
}

/**
 * Ask for the configuration of a provider
 * @returns {Promise<Object>} - The configuration
 * @public
 */
export async function askProvidersConfiguration () {
  const selectedProvider = await select({
    message: 'Which provider do you want to add to your Clever AI Chat?',
    choices: PROVIDERS.map((p) => ({ name: p.name, value: p })),
  });

  Logger.debug(`Selected provider: ${JSON.stringify(selectedProvider, null, 2)}`);

  return await buildProviderConfiguration(selectedProvider);
}

/**
 * Ask for the configuration of an Ollama provider
 * @param {Object} provider - The provider
 * @throws {Error} If no base URL is provided
 * @returns {Object} - The configuration
 * @private
 */
async function askOllamaConfiguration (provider) {
  const baseUrl = await input({ message: 'Enter your Ollama instance URL:' });

  if (!baseUrl) {
    Logger.error(`An instance URL is needed to use ${provider.name} models`);
    process.exit(1);
  }

  const token = await password({ message: 'Enter your Ollama Bearer token:', defaultValue: null });
  const supportedModels = await AiProviders.listModels(provider.value, token, baseUrl);
  const defaultModel = await select({
    message: 'Which model do you want to use as default?',
    choices: supportedModels.map((m) => ({ name: m.id, value: m.id })),
  });

  const providerConfiguration = createProviderConfig(provider, {
    base_url: baseUrl,
    token: token || null,
  }, {
    model: defaultModel,
    num_predict: -1,
  });

  return providerConfiguration;
}

/**
 * Ask for the configuration of an OpenAI compatible provider
 * @param {Object} provider - The provider
 * @throws {Error} If no Bearer token is provided
 * @returns {Object} - The configuration
 * @private
 */
async function askOpenAICompatibleConfiguration (provider) {
  const envVarName = `${provider.value.toUpperCase()}_API_KEY`;
  const envToken = process.env[envVarName];

  let token = null;
  if (envToken) {
    const useDefaultToken = await confirm({
      message: `Do you want to use ${provider.name} Bearer token from ${envVarName} environment variable?`,
    });
    token = useDefaultToken ? envToken : null;
  }

  if (!token) {
    token = await password({ message: `Enter a valid ${provider.name} Bearer token:` });
  }

  if (!token) {
    Logger.error(`A valid Bearer token is needed to use ${provider.name} models`);
    process.exit(1);
  }

  const supportedModels = await AiProviders.listModels(provider.value, token);

  const defaultModel = await select({
    message: 'Which model do you want to use as default?',
    choices: supportedModels.map((m) => ({ name: m.id, value: m.id })),
  });

  const providerConfiguration = createProviderConfig(provider, {
    token,
  }, {
    model: defaultModel,
  });

  return providerConfiguration;
}

/**
 * Build a provider configuration
 * @param {Object} provider - The provider
 * @returns {Promise<Object>} - The configuration
 * @private
 */
async function buildProviderConfiguration (provider) {
  switch (provider.value) {
    case 'Ollama':
      return await askOllamaConfiguration(provider);
    default:
      return await askOpenAICompatibleConfiguration(provider);
  }
}

/**
 * Create a provider configuration
 * @param {Object} provider - The provider
 * @param {Object} connection - The connection configuration
 * @param {Object} options - The options configuration
 * @returns {Object} - The provider configuration
 * @private
 */
function createProviderConfig (provider, connection, options) {
  const config = {
    provider: provider.value,
    name: provider.name,
    connection,
    options,
  };

  // Log a copy of the configuration with the token masked for security reasons
  Logger.debug('Generated provider configuration:');
  Logger.debug(JSON.stringify({
    ...config,
    connection: {
      ...connection,
      token: maskToken(connection.token),
    },
  }, null, 2));

  return config;
}

/**
 * Replace environment variable tokens with their actual values
 * @param {Object} config - The configuration object containing llm_configurations
 * @returns {Object} - The updated configuration
 * @private
 */
function replaceEnvTokens (config) {
  config.llm_configurations = config.llm_configurations.map((llmConfig) => {
    const { token } = llmConfig.connection;
    if (token === `${llmConfig.name.toUpperCase()}_API_KEY`) {
      return {
        ...llmConfig,
        connection: {
          ...llmConfig.connection,
          token: process.env[token] || null,
        },
      };
    }
    return llmConfig;
  });
  return config;
}

/**
 * Get a token from the configuration file if available for a provider
 * @param {string} provider - The provider name
 * @returns {string|null} - The token or null if not found
 * @public
 */
export async function getTokenFromConfig (provider) {
  const config = await getConfigurationFromFile();

  if (!config) {
    Logger.debug(`No configuration file found to get token for ${provider}`);
    return null;
  }

  const foundProvider = config.llm_configurations.find((p) => p.name.toLowerCase() === provider.toLowerCase());

  if (!foundProvider || !foundProvider.connection.token) {
    Logger.debug(`No token found for ${provider} in configuration file`);
    return null;
  }

  if (foundProvider.connection.token === `${provider.toUpperCase()}_API_KEY`) {
    Logger.debug(`Using ${provider} token from environment variable`);
    return process.env[foundProvider.connection.token];
  }

  return foundProvider.connection.token;
}

/**
 * Get a base URL from the configuration file if available for a provider
 * @param {string} provider - The provider name
 * @returns {string|null} - The base URL or null if not found
 * @public
 */
export async function getBaseUrlFromConfig (provider) {
  const config = await getConfigurationFromFile();

  if (!config) {
    Logger.debug(`No configuration file found to get base URL for ${provider}`);
    return null;
  }

  const foundProvider = config.llm_configurations.find((p) => p.name.toLowerCase() === provider.toLowerCase());

  if (!foundProvider || !foundProvider.connection.base_url) {
    Logger.debug(`No base URL found for ${provider} in configuration file`);
    return null;
  }

  return foundProvider.connection.base_url;
}
