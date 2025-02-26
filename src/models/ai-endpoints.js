import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { createAiEndpoint, deleteAiEndpoint, getAiEndpoint, getAiEndpoints, getAiEndpointStatus, getAiEndpointTemplate, searchAiEndpoints, deployAiEndpoint, undeployAiEndpoint, updateAiEndpoint } from './ai-api.js';
import { sendToApi } from '../models/send-to-api.js';

const AI_REAL_ID = process.env.AI_REAL_ID;

/**
 * Create a Clever AI Endpoint
 * @param {Object} payload - The Clever AI Endpoint payload
 * @returns {Promise<Object>} The created Clever AI Endpoint
 * @public
 */
export async function create (payload) {
  return await createAiEndpoint({ aiId: AI_REAL_ID, endpointId: payload.uid }, JSON.stringify(payload)).then(sendToApi);
}

/**
 * Deploy a Clever AI Endpoint
 * @param {string} uid - The Clever AI Endpoint UID
 * @public
 */
export async function deploy (uid) {
  await deployAiEndpoint({ aiId: AI_REAL_ID, endpointId: uid }).then(sendToApi);
}

/**
 * Undeploy a Clever
 * @param {string} uid - The Clever AI Endpoint UID
 * @public
 */
export async function undeploy (uid) {
  await undeployAiEndpoint({ aiId: AI_REAL_ID, endpointId: uid }).then(sendToApi);
}

/**
 * Get an Clever AI Endpoint or show a list of endpoints if multiple are found
 * @param {string} endpointNameOrUid - The Clever AI Endpoint name or UID
 * @throws {Error} When no endpoint is found
 * @returns {Promise<Object>} - The Clever AI Endpoint (or print a list of endpoints if multiple are found)
 * @public
 */
export async function getEndpointOrShowList (endpointNameOrUid) {
  let endpoints;

  if (endpointNameOrUid.startsWith('endpoint_')) {
    endpoints = await getAiEndpoint({ aiId: AI_REAL_ID, endpointId: endpointNameOrUid }).then(sendToApi);
  }
  else {
    endpoints = await list();
    endpoints = endpoints.filter((endpoint) => endpoint.name === endpointNameOrUid);
  }

  if (!Array.isArray(endpoints)) {
    return endpoints;
  }

  if (endpoints.length === 0) {
    Logger.error(`No Clever AI Chat service found for ${colors.red(endpointNameOrUid)}`);
    process.exit(1);
  }

  if (endpoints.length > 1) {
    Logger.println(`🔎 Multiple endpoints found for ${colors.yellow(endpointNameOrUid)}, use endpoint UID instead:`);
    Logger.println(colors.grey(endpoints.map((e) => ` - ${e.name} (${e.uid})`).join('\n')));
    process.exit(1);
  }

  return endpoints[0];
}

/**
 * Get the status of a Clever AI Endpoint
 * @param {string} uid - The Clever AI Endpoint UID
 * @returns {Promise<Object>} - The Clever AI Endpoint status
 * @public
 */
export async function getStatus (uid) {
  return await getAiEndpointStatus({ aiId: AI_REAL_ID, endpointId: uid }).then(sendToApi);
}

/**
 * Get Clever AI Endpoint and LLM Configuration templates
 * @returns {Promise<Object>} - The Clever AI Endpoint and LLM Configuration templates
 * @property {Object} endpoint - The Clever AI Endpoint template
 * @property {Object} llm_configuration - The LLM Configuration template
 * @public
 */
export async function getTemplates () {
  const response = await getAiEndpointTemplate({ aiId: AI_REAL_ID }).then(sendToApi);

  return {
    endpoint: response,
    llm_configuration: response.llm_configurations[0],
  };
}

/**
 * List all Clever AI Endpoints
 * @returns {Promise<Array<Object>>} - The list of Clever AI Endpoints
 * @public
 */
export async function list () {
  return await getAiEndpoints({ aiId: AI_REAL_ID }).then(sendToApi);
}

/**
 * Prepare an Clever AI Endpoint for human output
 * @param {Object} endpoint - The Clever AI Endpoint
 * @throws {Error} When no endpoint is provided
 * @returns {Object} - The prepared Clever AI Endpoint
 * @public
 */
export function prepareEndpointForHumanOutput (endpoint) {
  if (!endpoint) {
    Logger.error('No endpoint provided');
    process.exit(1);
  }

  if (endpoint.length === 0
    || !endpoint.uid
    || !endpoint.name
    || !endpoint.frontend_base
    || !endpoint.llm_configurations
    || !endpoint.web_ui_settings
    || !endpoint.web_ui_settings.enabled
    || !endpoint.default_configuration
    || endpoint.llm_configurations.length < 1
  ) {
    Logger.error('Endpoint is invalid');
    process.exit(1);
  }

  return {
    uid: endpoint.uid,
    name: endpoint.name,
    description: endpoint.description,
    frontend_base: `https://${endpoint.frontend_base}`,
    provider: endpoint.llm_configurations.find((c) => c.name === endpoint.default_configuration).provider,
    web_ui: endpoint.web_ui_settings.enabled ? `https://${endpoint.web_ui_settings.frontend}` : false,
  };
}

/**
 * Undeploy and delete a Clever AI Endpoint
 * @param {string} uid - The Clever AI Endpoint UID
 * @public
 */
export async function undeployAndDelete (uid) {
  await undeploy(uid);
  await deleteAiEndpoint({ aiId: AI_REAL_ID, endpointId: uid }).then(sendToApi);
}

/**
 * Search Clever AI Endpoints
 * @param {Object} payload - The search payload
 * @returns {Promise<Array<Object>>} - The list of corresponding Clever AI Endpoints
 * @public
 */
export async function search (payload) {
  return await searchAiEndpoints({ aiId: AI_REAL_ID, endpointId: payload.uid }, JSON.stringify(payload)).then(sendToApi);
}

/**
 * Update an Clever AI Endpoint and redeploy it if asked
 * @param {string} uid - The Clever AI Endpoint UID
 * @param {Object} payload - The Clever AI Endpoint payload
 * @param {boolean} [redeploy=true] - Whether to redeploy the endpoint
 * @returns {Promise<Object>} - The updated Clever AI Endpoint
 * @public
 */
export async function update (uid, payload, redeploy = true) {
  const response = await updateAiEndpoint({ aiId: AI_REAL_ID, endpointId: uid }, JSON.stringify(payload)).then(sendToApi);
  if (redeploy) {
    await deploy(uid);
  }
  return response;
}
