import fetch from 'node-fetch';
import colors from 'colors/safe.js';
import * as KMS from './kms-api.js';
import { conf } from './configuration.js';

/**
 * Get secret from Clever KMS
 * @param {string} secret
 * @returns {Promise<object>} secret data
 */
export async function getSecret (secret) {
  return KMS.getSecret({ secret }).then(sendToKMS);
};

/**
 * Patch secret in Clever KMS
 * @param {string} secret
 * @param {Array<string>} data - key=value pairs
 * @returns {Promise<object>} secret data
 */
export const patchSecret = (secret, data) => {
  return KMS.patchSecret({ secret }, {
    options: { cas: 0 },
    data: checkKeyValues(data),
  }).then(sendToKMS);
};

/**
 * Put secret in Clever KMS
 * @param {string} secret
 * @param {Array<string>} data - key=value pairs
 * @returns {Promise<object>} secret data
 */
export const putSecret = (secret, data) => {
  return KMS.putSecret({ secret }, {
    options: { cas: 0 },
    data: checkKeyValues(data),
  }).then(sendToKMS);
};

/**
 * Check key=value pairs
 * @param {Array<string>} keyValues
 * @returns {object} valid key=value pairs
 */
export const checkKeyValues = (keyValues) => {
  const parsed = {};

  for (const kv of keyValues) {
    const [key, value] = kv.split('=');
    if (!value) {
      console.error(`${colors.yellow('[WARNING]')} Invalid format: ${colors.yellow(kv)}, expected key=value`);
      continue;
    }
    parsed[key] = value;
  }
  return parsed;
};

/**
 * Send a request to Clever KMS
 * @param {object} request - request object for fetch
 * @returns {Promise<object>} response data
 * @throws {Error} if the request fails
 * @throws {Error} if the secret is not found
 */
export async function sendToKMS (request) {

  request.url = `${conf.KMS_HOST}${request.url}`;
  request.headers['X-Vault-Token'] = process.env.VAULT_TOKEN;

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(request.body),
  });

  if (response.status === 404) {
    throw new Error(`Secret not found: ${colors.red(request.url)}`);
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${response.statusText}`);
  }

  return response.json();
};
