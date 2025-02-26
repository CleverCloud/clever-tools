import { Logger } from '../logger.js';
import { confirm } from '@inquirer/prompts';
import * as AiConfig from '../models/ai-config.js';

// TODO: Not restart from scratch if there is an error during configuration
/**
 * Get or ask for the providers configuration for a Clever AI Chat service
 * @param {string} conf - The path to the configuration file
 * @param {boolean} interactive - Whether to ask for providers configuration
 * @returns {Promise<Object>} - The providers configuration
 * @public
 */
export async function getOrAskChatServiceConfig (conf, interactive) {
  if (!interactive) {
    const configFromFile = await AiConfig.getConfigurationFromFile(conf);

    if (configFromFile) {
      return configFromFile;
    }
  }

  Logger.debug('Asking for providers configuration');
  const llm_configurations = [];

  // We ask the user for providers configuration until he asks to stop
  while (true) {
    const providerConfiguration = await AiConfig.askProvidersConfiguration();
    llm_configurations.push(providerConfiguration);

    const continuePrompt = await confirm({ message: 'Do you want to add another provider?', default: false });
    if (!continuePrompt) {
      break;
    }

    Logger.println('');
  }

  return {
    // TODO: We should ask the user for the default provider
    default_configuration: llm_configurations[0].provider,
    llm_configurations,
  };
}
