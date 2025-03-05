import { Logger } from '../logger.js';
import { addOauthHeader } from '@clevercloud/client/esm/oauth.js';
import { conf, loadOAuthConf } from './configuration.js';
import { prefixUrl } from '@clevercloud/client/esm/prefix-url.js';
import { request } from '@clevercloud/client/esm/request.fetch.js';
import { subtle as cryptoSuble } from 'node:crypto';
import { addOauthHeaderPlaintext } from '../clever-client/auth-bridge.js';
import colors from 'colors/safe.js';

// Required for @clevercloud/client with "old" Node.js
if (globalThis.crypto == null) {
  globalThis.crypto = {
    subtle: cryptoSuble,
  };
}

async function loadTokens () {
  const tokens = await loadOAuthConf();
  return {
    OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: tokens.token,
    API_OAUTH_TOKEN_SECRET: tokens.secret,
  };
}

export async function sendToApi (requestParams) {
  const tokens = await loadTokens();
  return Promise.resolve(requestParams)
    .then(prefixUrl(conf.API_HOST))
    .then(addOauthHeader(tokens))
    .then((requestParams) => {
      Logger.debug(`${requestParams.method.toUpperCase()} ${requestParams.url} ? ${JSON.stringify(requestParams.queryParams)}`);
      return requestParams;
    })
    .then(request)
    .catch(processError);
}

export async function sendToAuthBridge (requestParams) {
  const tokens = await loadTokens();
  return Promise.resolve(requestParams)
    .then(prefixUrl(conf.AUTH_BRIDGE_HOST))
    .then(addOauthHeaderPlaintext(tokens))
    .then((requestParams) => {
      Logger.debug(`${requestParams.method.toUpperCase()} ${requestParams.url} ? ${JSON.stringify(requestParams.queryParams)}`);
      return requestParams;
    })
    .then(request)
    .catch(processError);
}

export function processError (error) {
  const code = error.code ?? error?.cause?.code;
  if (code === 'EAI_AGAIN') {
    throw new Error('Cannot reach the Clever Cloud API, please check your internet connection.', { cause: error });
  }
  if (code === 'ECONNRESET') {
    throw new Error('The connection to the Clever Cloud API was closed abruptly, please try again.', { cause: error });
  }
  if (error?.response?.status === 401) {
    throw new Error(`You're not logged in, use ${colors.red('clever login')} command to connect to your Clever Cloud account`, { cause: error });
  }
  throw error;
}

export async function getHostAndTokens () {
  const tokens = await loadTokens();
  return {
    apiHost: conf.API_HOST,
    tokens,
  };
}
