import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import * as Apikeys from '../models/ai-api-keys.js';
import * as AiEndpoints from '../models/ai-endpoints.js';

/**
 * List all API keys for a Clever AI Endpoint
 * @param {Object} params - The command parameters
 * @param {string[]} params.args[0] - The Clever AI Endpoint name or UID
 * @public
 */
export async function list (params) {
  const [endpointNameOrUid] = params.args;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const apikeys = await Apikeys.list(endpoint.uid);

  console.table(apikeys, ['uid', 'enabled', 'client_id']);
}

/**
 * Deploy an API key for a Clever AI Endpoint
 * @param {Object} params - The command parameters
 * @param {string[]} params.args[0] - The API Key UID
 * @param {string[]} params.args[1] - The Clever AI Endpoint name or UID
 * @public
 */
export async function deploy (params) {
  const [apiKeyUid, endpointNameOrUid] = params.args;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  await Apikeys.deploy(endpoint.uid, apiKeyUid);

  Logger.println(`${colors.green('✓')} Clever AI Endpoint ${colors.green(apiKeyUid)} deployed successfully`);
}

/**
 * Undeploy an API key for a Clever AI Endpoint
 * @param {Object} params - The command parameters
 * @param {string[]} params.args[0] - The API Key UID
 * @param {string[]} params.args[1] - The Clever AI Endpoint name or UID
 * @public
 */
export async function get (params) {
  const [apiKeyUid, endpointNameOrUid] = params.args;

  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const apiKey = await Apikeys.get(endpoint.uid, apiKeyUid);
  const status = await Apikeys.getStatus(endpoint.uid, apiKeyUid);
  console.table({
    UID: apiKey.uid,
    Status: `${apiKey.enabled ? 'enabled' : 'disabled'}/${status.deployed ? 'deployed' : 'undeployed'}`,
    Token: apiKey.token,
  });
}
