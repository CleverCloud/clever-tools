import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import { makeRequest } from './utils.js';
import { PROVIDERS, OVHAIENDPOINTS_MODELS } from '../ai-consts.js';

/**
 * List providers
 * @public
 */
export function listProviders () {
  return PROVIDERS;
}

/**
 * List available models for a provider
 * @param {string} provider - The provider name, it will be matched lowercased
 * @param {string} [token] - The provider token
 * @param {string} [url] - The provider URL
 * @throws {Error} If provider is not found
 * @returns {Promise<Object>} The list of models
 * @public
 */
export async function listModels (provider, token = null, url = null) {
  const foundProvider = PROVIDERS.find((p) => p.value === provider);
  if (!foundProvider) {
    Logger.error(`Provider ${colors.red(provider)} not found`);
    process.exit(1);
  }

  if (foundProvider.value === 'OVHcloudAIEndpoints') {
    return listOvhAiEndpointsModels();
  }

  const payload = {
    baseUrl: url || foundProvider.base_url,
    method: 'GET',
    route: '/v1/models',
  };

  if (!payload.baseUrl) {
    Logger.error(`A base URL is needed to list ${provider} models`);
    process.exit(1);
  }

  if (token) {
    payload.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  if (foundProvider.value === 'Anthropic') {
    payload.headers = {
      'anthropic-version': '2023-06-01',
      'x-api-key': token,
    };
  }

  return (await makeRequest(payload)).data;
}

/**
 * List available models for OvhAiEndpoints
 * @private
 */
function listOvhAiEndpointsModels () {
  return {
    updateDate: OVHAIENDPOINTS_MODELS.updateDate,
    models: OVHAIENDPOINTS_MODELS.models.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
