import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import * as AiEndpoints from '../models/ai-endpoints.js';
import * as AiApiKeys from '../models/ai-api-keys.js';
import { maskToken } from '../models/utils.js';

/**
 * Deploy a Clever AI Endpoint
 * @param {string} uid - The Clever AI Endpoint UID
 * @public
 */
export async function deploy (params) {
  const { 'chat-name-or-uid': uid } = params.namedArgs;
  await AiEndpoints.deploy(uid);
  Logger.println(`Clever AI Endpoint ${colors.green(uid)} deployed successfully`);
}
/**
* Undeploy a Clever AI Endpoint
* @param {string} uid - The Clever AI Endpoint UID
* @public
*/
export async function undeploy (params) {
  const { 'chat-name-or-uid': uid } = params.namedArgs;
  await AiEndpoints.undeploy(uid);
  Logger.println(`Clever AI Endpoint ${colors.green(uid)} undeployed successfully`);
}

/**
 * Print information about a Clever AI Endpoint
 * @param {Object} params - The command parameters
 * @param {string} params.chat-name-or-uid - The Clever AI Endpoint name or UID
 * @param {string} params.format - The output format
 * @public
 */
export async function showInfo (params) {
  const { 'chat-name-or-uid': uid } = params.namedArgs;
  const { format } = params.options;

  const endpoint = await AiEndpoints.getEndpointOrShowList(uid);

  switch (format) {
    case 'json':
      Logger.printJson(endpoint);
      break;
    case 'human':
    default:
      console.table(AiEndpoints.prepareEndpointForHumanOutput(endpoint));
      break;
  }
}

/**
 * List Clever AI Endpoints
 * @param {Object} params - The command parameters
 * @returns {Promise<void>} - The function does not return a value
 * @public
 */
export async function list (params) {
  const { format } = params.options;

  const endpoints = await AiEndpoints.list();

  if (endpoints.error) {
    Logger.error(endpoints.error_description || endpoints.error);
    process.exit(1);
  }

  const data = endpoints
    .map(({ name, uid, frontend_base, web_ui_settings }) => ({ Name: name, UID: uid, 'Chat Service Access': web_ui_settings.enabled ? `https://${web_ui_settings.frontend}` : `https://${frontend_base}/chat/completions` }));

  switch (format) {
    case 'json':
      Logger.printJson(data);
      break;
    case 'human':
    default:
      if (data.length === 0) {
        Logger.println(`No Clever AI Endpoint found, create one with ${colors.blue('clever ai create')} command`);
      }
      else {
        Logger.println(`${colors.green(data.length)} Clever AI Endpoint(s) found:`);
        console.table(data);
      }
      break;
  }
}

/**
 * Delete an Clever AI Endpoint or all Clever AI Endpoints if --all is used
 * @param {Object} params - The command parameters
 * @returns {Promise<void>} - The function does not return a value
 * @public
 */
export async function remove (params) {
  const { 'chat-name-or-uid': endpointId } = params.namedArgs;

  await AiEndpoints.remove(endpointId);
  Logger.println(`Clever AI Endpoint ${colors.green(endpointId)} deleted successfully`);
}

/**
 * Delete all Clever AI Endpoints
 * @param {Object} params - The command parameters
 * @returns {Promise<void>} - The function does not return a value
 * @public
 */
export async function removeAll () {

  const endpoints = await AiEndpoints.list();

  if (endpoints.length === 0) {
    Logger.println(`No Clever AI Endpoint found, create one with ${colors.blue('clever ai create')} command`);
    return;
  }

  for (const endpoint of endpoints) {
    await AiEndpoints.remove(endpoint.uid);
  }
  Logger.println('All Clever AI Endpoints deleted successfully');
}

/**
 * Deploy an Clever AI Endpoint or an API Key
 * @param {Object} params - The command parameters
 * @returns {Promise<void>} - The function does not return a value
 * @public
 */
export async function llmDeploy (params) {
  const { 'chat-name-or-uid': endpointId } = params.namedArgs;
  const { 'api-key': apiKeyId } = params.options;

  if (!endpointId.startsWith('endpoint_')) {
    Logger.error(`Endpoint UID ${colors.green(endpointId)} is not a valid Clever AI Endpoint UID`);
    process.exit(1);
  }

  if (apiKeyId) {
    if (!apiKeyId.startsWith('apikey_')) {
      Logger.error(`API Key UID ${colors.green(apiKeyId)} is not a valid Clever AI Endpoint API Key UID`);
      process.exit(1);
    }
    await AiApiKeys.deploy(endpointId, apiKeyId);
  }
  else {
    await AiEndpoints.deploy(endpointId);
  }
}

/**
 * Undeploy an Clever AI Endpoint or an API Key
 * @param {Object} params - The command parameters
 * @returns {Promise<void>} - The function does not return a value
 * @public
 */
export async function llmUndeploy (params) {
  const { 'chat-name-or-uid': endpointId } = params.namedArgs;
  const { 'api-key': apiKeyId } = params.options;

  if (!endpointId.startsWith('endpoint_')) {
    Logger.error(`Endpoint UID ${colors.green(endpointId)} is not a valid Clever AI Endpoint UID`);
    process.exit(1);
  }

  if (apiKeyId) {
    if (!apiKeyId.startsWith('apikey_')) {
      Logger.error(`API Key UID ${colors.green(apiKeyId)} is not a valid Clever AI Endpoint API Key UID`);
      process.exit(1);
    }
    await AiApiKeys.undeploy(endpointId, apiKeyId);
  }
  else {
    await AiEndpoints.undeploy(endpointId);
  }
}

/**
 * Get Clever AI Endpoint information including API Keys
 * @param {Object} params - The command parameters
 * @returns {Promise<void>} - The function does not return a value
 * @public
 */
export async function llmGet (params) {
  const { 'chat-name-or-uid': chatNameOrUid } = params.namedArgs;
  const { format } = params.options;

  const endpoint = await AiEndpoints.getEndpointOrShowList(chatNameOrUid);
  const apiKeys = await AiApiKeys.list(chatNameOrUid);

  switch (format) {
    case 'json': {
      const fused = { ...endpoint, apiKeys };
      Logger.printJson(fused);
      break;
    }
    case 'human':
    default:
      try {
        console.table(await AiEndpoints.prepareEndpointForHumanOutput(endpoint));
      }
      catch (error) {
        Logger.error(error);
        process.exit(1);
      }
      Logger.println(`${colors.blue(apiKeys.length)} API Key(s) found:`);
      console.table(apiKeys.map(({ uid, token, apikey_quotas_override, llm_tokens_quotas_override }) => ({ UID: uid, token: maskToken(token), 'API Key Quotas Override': apikey_quotas_override, 'LLM Tokens Quotas Override': llm_tokens_quotas_override })));
      break;
  }
}
