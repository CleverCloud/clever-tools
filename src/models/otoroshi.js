import fetch from 'node-fetch';

import * as Operator from './operators.js';
import * as application from '@clevercloud/client/esm/api/v2/application.js';

import { Logger } from '../logger.js';
import { sendToApi } from './send-to-api.js';
import { getRoutes } from './otoroshi-instances-api.js';

/**
 * Get Otoroshi routes
 * @param {object} otoroshi The Otoroshi API parameters
 * @param {string} otoroshi.apiUrl The Otoroshi API URL
 * @param {string} otoroshi.apiId The Otoroshi API ID
 * @param {string} otoroshi.apiSecret The Otoroshi API secret
 * @returns {Promise<object>} The Otoroshi routes
 */
export async function getOtoroshiRoutes (otoroshi) {
  const otoroshiAPI = await getOtoroshiApiParams(otoroshi);
  return getRoutes(otoroshiAPI).then(sendToOtoroshi);
}

export async function createOtoroshiRoute (otoroshi, otoroshiApp, route) {

}

/**
 * Get Otoroshi API parameters from a given name or object
 * @param {object | string} addonIdOrName The Otoroshi addon ID or name
 * @returns {Promise<object>} The Otoroshi API parameters
 */
export async function getOtoroshiApiParams (addonIdOrName) {

  const otoroshi = await Operator.getWithEnv('otoroshi', addonIdOrName);
  const otoroshiEnv = await application.getAllEnvVars({ id: otoroshi.ownerId, appId: otoroshi.javaId }).then(sendToApi);

  const routeBaseDomain = otoroshiEnv.find((env) => env.name === 'OTOROSHI_ROUTE_BASE_DOMAIN');
  if (!routeBaseDomain) {
    const allDomains = await application.getAllDomains({ id: otoroshi.ownerId, appId: otoroshi.javaId }).then(sendToApi);
    const domainToUse = allDomains.find((domain) => domain.fqdn.endsWith('.cleverapps.io'));

    Logger.info(`Setting 'OTOROSHI_ROUTE_BASE_DOMAIN' environment variable to ${domainToUse.fqdn} for ${otoroshi.javaId} `);
    await application.updateEnvVar({ id: otoroshi.ownerId, appId: otoroshi.javaId, envName: 'OTOROSHI_ROUTE_BASE_DOMAIN' }, { value: domainToUse.fqdn }).then(sendToApi);
  }

  return {
    otoroshi: otoroshi.name,
    apiUrl: otoroshiEnv.find((env) => env.name === 'CC_OTOROSHI_API_URL').value,
    apiId: otoroshiEnv.find((env) => env.name === 'ADMIN_API_CLIENT_ID').value,
    apiSecret: otoroshiEnv.find((env) => env.name === 'ADMIN_API_CLIENT_SECRET').value,
    routeBaseDomain: otoroshiEnv.find((env) => env.name === 'OTOROSHI_ROUTE_BASE_DOMAIN').value,
  };
}

/**
 * Send a request to Otoroshi API
 * @param {object} request
 * @param {string} request.url
 * @param {string} request.method
 * @param {object} request.headers
 * @param {object} request.body
 * @throws {Error} if the response status is greater or equal to 400
 * @returns {object} the response
 */
export async function sendToOtoroshi (request) {
  const options = {
    method: request.method,
    headers: request.headers,
  };

  if (request.body) {
    options.body = JSON.stringify(request.body);
  }
  Logger.info(`Sending a ${options.method.toUpperCase()} request to Otoroshi: ${request.url}`);
  const response = await fetch(request.url, options);

  if (response.status >= 400) {
    Logger.debug(`Body sent: ${JSON.stringify(request.body, null, 2)}`);
    throw new Error(`Error while requesting otoroshi (${response.status}): ${response.statusText}`);
  }

  if (response.status === 204) {
    return;
  }

  return response.json();
}
