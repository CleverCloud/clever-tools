import { addOauthHeader } from '@clevercloud/client/esm/oauth.js';
import { prefixUrl } from '@clevercloud/client/esm/prefix-url.js';
import { request } from '@clevercloud/client/esm/request.fetch.js';
import { subtle as cryptoSuble } from 'node:crypto';
import { addOauthHeaderPlaintext } from '../clever-client/auth-bridge.js';
import { config } from '../config/config.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';

// Required for @clevercloud/client with "old" Node.js
if (globalThis.crypto == null) {
  globalThis.crypto = {
    subtle: cryptoSuble,
  };
}

function getTokens() {
  return {
    OAUTH_CONSUMER_KEY: config.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: config.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: config.token,
    API_OAUTH_TOKEN_SECRET: config.secret,
  };
}

export function sendToApi(requestParams) {
  const tokens = getTokens();
  return Promise.resolve(requestParams)
    .then(prefixUrl(config.API_HOST))
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

export function sendToAuthBridge(requestParams) {
  const tokens = getTokens();
  return Promise.resolve(requestParams)
    .then(prefixUrl(config.AUTH_BRIDGE_HOST))
    .then(addOauthHeaderPlaintext(tokens))
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
  const tokens = getTokens();
  return {
    apiHost: config.API_HOST,
    tokens,
  };
}
