import { addOauthHeader } from '@clevercloud/client/esm/oauth.js';
import { prefixUrl } from '@clevercloud/client/esm/prefix-url.js';
import { request } from '@clevercloud/client/esm/request.fetch.js';
import { subtle as cryptoSubtle } from 'node:crypto';
import { config } from '../config/config.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';

// Required for @clevercloud/client with "old" Node.js
if (globalThis.crypto == null) {
  globalThis.crypto = {
    subtle: cryptoSubtle,
  };
}

export async function sendToApi(requestParams) {
  return executeRequest(requestParams);
}

export async function sendToAuthBridge(requestParams) {
  return executeRequest(requestParams, { API_HOST: config.AUTH_BRIDGE_HOST });
}

/**
 * Creates an API request function with a custom config.
 * @param {object} customConfig
 * @param {string} customConfig.token - OAuth token
 * @param {string} customConfig.secret - OAuth secret
 * @param {string} customConfig.apiHost - API host
 * @param {string} customConfig.consumerKey - OAuth consumer key
 * @param {string} customConfig.consumerSecret - OAuth consumer secret
 * @returns {(requestParams: object) => Promise<unknown>}
 */
export function sendToApiWithConfig(customConfig) {
  return (requestParams) =>
    executeRequest(requestParams, {
      API_HOST: customConfig.apiHost,
      OAUTH_CONSUMER_KEY: customConfig.consumerKey,
      OAUTH_CONSUMER_SECRET: customConfig.consumerSecret,
      API_OAUTH_TOKEN: customConfig.token,
      API_OAUTH_TOKEN_SECRET: customConfig.secret,
    });
}

/**
 * Executes the request pipeline with the given configuration.
 * @param {object} requestParams - The request parameters
 * @param {object} [customConfig] - Optional configuration overrides
 * @param {string} [customConfig.API_HOST] - API host URL
 * @param {string} [customConfig.OAUTH_CONSUMER_KEY] - OAuth consumer key
 * @param {string} [customConfig.OAUTH_CONSUMER_SECRET] - OAuth consumer secret
 * @param {string} [customConfig.API_OAUTH_TOKEN] - OAuth token
 * @param {string} [customConfig.API_OAUTH_TOKEN_SECRET] - OAuth token secret
 * @returns {Promise<unknown>}
 */
async function executeRequest(requestParams, customConfig = {}) {
  const host = customConfig.API_HOST ?? config.API_HOST;
  const tokens = {
    OAUTH_CONSUMER_KEY: customConfig.OAUTH_CONSUMER_KEY ?? config.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: customConfig.OAUTH_CONSUMER_SECRET ?? config.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: customConfig.API_OAUTH_TOKEN ?? config.token,
    API_OAUTH_TOKEN_SECRET: customConfig.API_OAUTH_TOKEN_SECRET ?? config.secret,
  };

  return Promise.resolve(requestParams)
    .then(prefixUrl(host))
    .then(addOauthHeader(tokens))
    .then((requestParams) => {
      Logger.debug(
        `${requestParams.method.toUpperCase()} ${requestParams.url} ? ${JSON.stringify(requestParams.queryParams)}`,
      );
      return requestParams;
    })
    .then(request)
    .catch(processError);
}

export function processError(error) {
  const code = error.code ?? error?.cause?.code;
  if (code === 'EAI_AGAIN') {
    throw new Error('Cannot reach the Clever Cloud API, please check your internet connection.', { cause: error });
  }
  if (code === 'ECONNRESET') {
    throw new Error('The connection to the Clever Cloud API was closed abruptly, please try again.', { cause: error });
  }
  if (error?.response?.status === 401) {
    throw new Error(
      `You're not logged in, use ${styleText('red', 'clever login')} command to connect to your Clever Cloud account`,
      { cause: error },
    );
  }
  throw error;
}

export function getHostAndTokens() {
  return {
    apiHost: config.API_HOST,
    tokens: {
      OAUTH_CONSUMER_KEY: config.OAUTH_CONSUMER_KEY,
      OAUTH_CONSUMER_SECRET: config.OAUTH_CONSUMER_SECRET,
      API_OAUTH_TOKEN: config.token,
      API_OAUTH_TOKEN_SECRET: config.secret,
    },
  };
}
