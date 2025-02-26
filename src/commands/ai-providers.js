import colors from 'colors/safe.js';

import * as AiConfig from '../models/ai-config.js';
import * as AiProviders from '../models/ai-providers.js';

import { Logger } from '../logger.js';
import { PROVIDERS } from '../ai-consts.js';
import { input, select, password } from '@inquirer/prompts';

/**
 * List available AI providers
 * @public
 */
export async function list (params) {
  const { format } = params.options;

  const providers = AiProviders.listProviders();

  switch (format) {
    case 'json':
      Logger.printJson(providers);
      break;
    case 'human':
    default:
      Logger.println(`🔎 Found ${colors.green(providers.length)} available AI providers:`);
      providers.forEach((provider) => {
        Logger.println(colors.grey(` - ${provider.name}`));
      });
      break;
  }
}

/**
 * List available models for a provider
 * @param {Object} params - The command parameters
 * @param {string} params.provider - The provider name, it will be matched lowercased
 * @public
 */
export async function listModels (params) {
  let { provider } = params.options;

  if (!provider) {
    provider = await select({
      message: 'Which provider do you want to list models for?',
      choices: PROVIDERS.map((p) => ({ name: p.name, value: p.value })),
    });
  }

  const providerName = PROVIDERS.find((p) => p.value === provider).name;

  if (provider === 'OvhAiEndpoints') {
    const { updateDate, models } = await AiProviders.listOvhAiEndpointsModels();
    const updateDateString = new Date(updateDate).toLocaleDateString();
    Logger.println(`🔎 Found ${colors.green(models.length)} models for ${colors.green(providerName)} supported as of ${updateDateString}:`);

    models.forEach((model) => {
      const createdDate = new Date(model.created_at).toLocaleDateString();
      Logger.println(colors.grey(` - ${model.name} (${createdDate})`));
    });
    return;
  }

  let token = await AiConfig.getTokenFromConfig(provider);

  if (!token) {
    token = await password({
      message: `Enter a valid Bearer token for ${providerName}:`,
      default: null,
    });
  }

  let base_url = PROVIDERS.find((p) => p.value === provider).base_url;
  if (!base_url) base_url = await AiConfig.getBaseUrlFromConfig(provider);
  if (!base_url) base_url = await input({ message: `Enter the base URL for ${providerName}:` });

  const models = await AiProviders.listModels(provider, token, base_url);

  Logger.println(`🔎 Found ${colors.green(models.length)} models for ${colors.green(providerName)}:`);
  models.forEach((model) => {
    const createdDate = new Date(model.created * 1000).toLocaleDateString();
    Logger.println(colors.grey(` - ${model.id} (${createdDate})`));
  });
}
