import fetch from 'node-fetch';
import { Logger } from '../logger.js';
import password from '@inquirer/password';

const AUTH_BRIDGE_URL = 'https://XXX.clever-cloud.com';
const AUTH_BRIDGE_ENDPOINT = `${AUTH_BRIDGE_URL}/api-tokens`;

/**
 * Create a new API token.
 * @param {Object} params - Function parameters
 * @param {string[]} params.args - Command line arguments
 * @param {Object} params.options - Command line options
 * @returns {Promise<void>}
 * @throws {Error} If the response is not OK
 */
export async function create (params) {
  const [email] = params.args;
  const { format } = params.options;

  const pass = await password({ message: 'Enter your password:', mask: true });
  const mfa = await password({ message: 'Enter your 2FA code:', mask: true });

  const headers = {
    Authorization: `Basic ${Buffer.from(`${email}:${pass}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'x-cc-mfa-code': mfa,
  };

  try {
    const response = await queryAuthBridge('POST', headers);
    const data = await handleApiResponse(response);

    if (!data.apiToken || !data.expirationDate) {
      throw new Error('Invalid token data in the response');
    }

    if (format === 'json') {
      Logger.printJson({ apiTokenId: data.apiTokenId, apiToken: data.apiToken, expirationDate: data.expirationDate });
    }
    else {
      Logger.println(`
 - API token ID : ${data.apiTokenId}
 - API token    : ${data.apiToken}
 - Expiration   : ${new Date(data.expirationDate).toUTCString()}

Export this token and use it to make authenticated requests to the Clever Cloud API through the Auth Bridge:

export CC_API_TOKEN=${data.apiToken}
curl -H "Authorization: Bearer $CC_API_TOKEN" ${AUTH_BRIDGE_URL}/v2/self

Then, to revoke this token, run:
clever token revoke ${data.apiTokenId}`);
    }
  }
  catch (error) {
    Logger.error(`API token creation failed: ${error.message}`);
  }
}

/**
 * Revoke an API token
 * @param {Object} params - Function parameters
 * @param {string[]} params.args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} If the response is not OK
 * @throws {Error} If the token is not specified
 */
export async function revoke (params) {
  const [tokenId] = params.args;

  try {
    // Try to delete the token corresponding to the provided ID
    let response = await deleteApiTokenRequest(tokenId);

    // If the API token is not valid (could be an env var from a previous session), ask for another API token
    if (response.status === 401) {
      response = await deleteApiTokenRequest(tokenId, true);
    }

    if (response.status === 204) {
      Logger.println('API token revoked successfully');
    }
    else {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  }
  catch (error) {
    Logger.error(`API token revocation failed: ${error.message}`);
  }
}

/**
 * Get information about an API token
 * @param {Object} params - Function parameters
 * @param {Object} params.options - Command line options
 * @returns {Promise<void>}
 * @throws {Error} If the response is not OK
 */
export async function get (params) {
  const { format } = params.options;

  try {
    // Try to get the tokens with the API token
    let response = await getApiTokensRequest();

    // If the API token is not valid (could be an env var from a previous session), ask for another API token
    if (response.status === 401) {
      response = await getApiTokensRequest(true);
    }

    if (response.status !== 200) {
      throw new Error(`API token fetching failed: ${response.status} ${response.statusText}`);
    }

    const tokens = await handleApiResponse(response);
    const currentSessionToken = tokens.find((t) => t.isCurrentSession);

    if (format === 'json') {
      Logger.printJson(currentSessionToken);
    }
    else {
      console.table({
        'Token ID': currentSessionToken.apiTokenId,
        'Creation IP address': currentSessionToken.ip,
        'Creation date/time': new Date(currentSessionToken.creationDate).toUTCString(),
        'Expiration date/time': new Date(currentSessionToken.expirationDate).toUTCString(),
      });
    }
  }
  catch (error) {
    Logger.error(`API token fetching failed: ${error.message}`);
  }
}

/**
 * Get the API token either from the environment or from user input
 * @param {boolean} forceInput - Force the user to input the token
 * @returns {Promise<string>} The API token
 */
async function getApiToken (forceInput = false) {
  if (process.env.CC_API_TOKEN && !forceInput) {
    return process.env.CC_API_TOKEN;
  }

  return password({ message: 'Enter your API token:', mask: true });
}

/**
 * Create a DELETE request for an API token
 * @param {string} apiTokenId - The API token ID
 * @returns {Promise<Response>} Fetch API response
 */
async function deleteApiTokenRequest (apiTokenId, forceInput = false) {
  const apiToken = await getApiToken(forceInput);
  const headers = { Authorization: `Bearer ${apiToken}` };
  return queryAuthBridge('DELETE', headers, `${AUTH_BRIDGE_ENDPOINT}/${apiTokenId}`);
}

/**
 * Create a GET request for API tokens
 * @returns {Promise<Response>} Fetch API response
 */
async function getApiTokensRequest (forceInput = false) {
  const apiToken = await getApiToken(forceInput);
  const headers = { Authorization: `Bearer ${apiToken}` };
  return fetch(AUTH_BRIDGE_ENDPOINT, {
    method: 'GET',
    headers,
  });
}

/**
 * Query the Auth Bridge
 * @param {string} method - HTTP method
 * @param {Object} headers - HTTP headers
 * @param {string} url - API endpoint
 * @returns {Promise<Response>} Fetch API response
 */

async function queryAuthBridge (method, headers, url = AUTH_BRIDGE_ENDPOINT) {

  Logger.debug(`${method} ${url}`);
  Logger.debug(JSON.stringify(headers, null, 2));

  return fetch(url, {
    method,
    headers,
  });
}

/**
 * Manage the API response and throw an error if the response is not OK
 * @param {Response} response - Fetch API response
 * @returns {Promise<any>} JSON data of the response
 * @throws {Error} If the response is not OK
 */
async function handleApiResponse (response) {

  Logger.debug(response.url);
  Logger.debug(`${response.status} ${response.statusText}`);

  if (!response.ok) {
    Logger.error(`${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();
  Logger.debug(JSON.stringify(data, null, 2));

  return data;
}
