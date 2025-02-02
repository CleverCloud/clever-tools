import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger.js';
import { sendToApi } from '../models/send-to-api.js';
import { createAiEndpointApiKey, deleteAiEndpointApiKey, deployAiEndpointApiKey, getAiEndpointApiKey, getAiEndpointApiKeyTemplate, listAiEndpointApiKeys, patchAiEndpointApiKey, searchAiEndpointApiKeys, undeployAiEndpointApiKey } from '../models/ai-api-keys-api.js';

const AI_REAL_ID = process.env.AI_REAL_ID;

/**
 * Create an API key for an Clever AI Endpoint
 * @param {string} endpointUid - The Clever AI Endpoint ID
 * @throws {Error} When endpointUid is not provided
 * @returns {Promise<{token: string, uid: string}>} The API Key token and ID
 * @public
 */
export async function create (endpointUid) {
  if (!endpointUid) {
    Logger.error('endpointUid is required');
    process.exit(1);
  }

  const template = await getTemplate(endpointUid);
  const apiKeyUid = `apikey_${uuidv4()}`;
  const payload = {
    ...template,
    endpoint: endpointUid,
    uid: apiKeyUid,
    name: apiKeyUid,
  };
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return await createAiEndpointApiKey({ aiId: AI_REAL_ID, endpointId: endpointUid }, JSON.stringify(payload)).then(sendToApi);
}

/**
 * Deploy an API key for an Clever AI End
 * @param {string} endpointUid - The Clever AI End ID
 * @param {string} apiKeyUid - The API Key ID
 * @throws {Error} When endpointUid or apiKeyUid is not provided
 * @returns {Promise<void>}
 * @public
 */
export async function deploy (endpointUid, apiKeyUid) {
  validateParams({ endpointUid, apiKeyUid }, ['endpointUid', 'apiKeyUid']);
  return await deployAiEndpointApiKey({ aiId: AI_REAL_ID, endpointId: endpointUid, apiKeyId: apiKeyUid }).then(sendToApi);
}

/**
 * Undeploy an API key for an Clever AI End
 * @param {string} endpointUid - The Clever AI End ID
 * @param {string} apiKeyUid - The API Key ID
 * @throws {Error} When endpointUid or apiKeyUid is not provided
 * @returns {Promise<void>}
 * @public
 */
export async function undeploy (endpointUid, apiKeyUid) {
  validateParams({ endpointUid, apiKeyUid }, ['endpointUid', 'apiKeyUid']);
  return await undeployAiEndpointApiKey({ aiId: AI_REAL_ID, endpointId: endpointUid, apiKeyId: apiKeyUid }).then(sendToApi);
}

/**
 * Get an API key for an Clever AI End by its ID
 * @param {string} endpointUid - The Clever AI End ID
 * @param {string} apiKeyUid - The API Key ID
 * @throws {Error} When endpointUid or apiKeyUid is not provided
 * @returns {Promise<Object>} The API key details
 * @public
 */
export async function get (endpointUid, apiKeyUid) {
  validateParams({ endpointUid, apiKeyUid }, ['endpointUid', 'apiKeyUid']);
  return await getAiEndpointApiKey({ aiId: AI_REAL_ID, endpointId: endpointUid, apiKeyId: apiKeyUid }).then(sendToApi);
}

/**
 * List API keys for an Clever AI End
 * @param {string} endpointUid - The Clever AI End ID
 * @throws {Error} When endpointUid is not provided
 * @returns {Promise<Array<Object>>} List of API keys
 * @public
 */
export async function list (endpointUid) {
  if (!endpointUid) {
    Logger.error('endpointUid is required');
    process.exit(1);
  }
  return listAiEndpointApiKeys({ aiId: AI_REAL_ID, endpointId: endpointUid }).then(sendToApi);
}

/**
 * Patch an API key for an Clever AI End
 * @param {string} endpointUid - The Clever AI End ID
 * @param {string} apiKeyUid - The API Key ID
 * @param {Object} payload - The API Key payload
 * @param {boolean} [redeploy=false] - Whether to redeploy the API key
 * @throws {Error} When endpointUid or apiKeyUid is not provided
 * @returns {Promise<Object>} The updated API key
 * @public
 */
export async function patch (endpointUid, apiKeyUid, payload, redeploy = false) {
  validateParams({ endpointUid, apiKeyUid }, ['endpointUid', 'apiKeyUid']);
  if (!payload) {
    Logger.error('payload is required');
    process.exit(1);
  }

  const response = patchAiEndpointApiKey({ aiId: AI_REAL_ID, endpointId: endpointUid, apiKeyId: apiKeyUid }, JSON.stringify(payload)).then(sendToApi);
  if (redeploy) {
    await deploy(endpointUid, apiKeyUid);
  }
  return response;
}
/**
 * Delete an API key for an Clever AI End
 * @param {string} endpointUid - The Clever AI End ID
 * @param {string} apiKeyUid - The API Key ID
 * @throws {Error} When endpointUid or apiKeyUid is not provided
 * @returns {Promise<void>}
 * @public
 */
export async function remove (endpointUid, apiKeyUid) {
  validateParams({ endpointUid, apiKeyUid }, ['endpointUid', 'apiKeyUid']);

  // Always undeploy the API key before deleting it
  await undeploy(endpointUid, apiKeyUid);
  return deleteAiEndpointApiKey({ aiId: AI_REAL_ID, endpointId: endpointUid, apiKeyId: apiKeyUid }).then(sendToApi);
}

/**
 * Search API keys for an Clever AI End
 * @param {string} endpointUid - The Clever AI End ID
 * @param {Object} payload - The search criteria
 * @throws {Error} When endpointUid or payload is not provided
 * @returns {Promise<Array<Object>>} Matching API keys
 * @public
 */
export async function search (endpointUid, payload) {
  if (!endpointUid) {
    Logger.error('endpointUid is required');
    process.exit(1);
  }
  if (!payload) {
    Logger.error('payload is required');
    process.exit(1);
  }
  return searchAiEndpointApiKeys({ aiId: AI_REAL_ID, endpointId: endpointUid }, JSON.stringify(payload)).then(sendToApi);
}

/**
 * Get API key template from API
 * @param {string} endpointUid - The Clever AI End ID
 * @throws {Error} When endpointUid is not provided
 * @returns {Promise<Object>} The API key template
 * @private
 */
async function getTemplate (endpointUid) {
  return await getAiEndpointApiKeyTemplate({ aiId: AI_REAL_ID, endpointId: endpointUid }).then(sendToApi);
}

/**
 * Utility function to validate parameters
 * @param {Object} params - The parameters to validate
 * @param {Array<string>} required - The required parameters
 * @throws {Error} When a required parameter is missing
 * @private
 */
function validateParams (params, required = []) {
  required.forEach((param) => {
    if (!params[param]) {
      Logger.error(`${param} is required`);
      process.exit(1);
    }
  });
}
