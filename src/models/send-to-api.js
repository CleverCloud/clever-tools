import { Logger } from '../logger.js';
import { addOauthHeader } from '@clevercloud/client/esm/oauth.js';
import { conf, loadOAuthConf } from '../models/configuration.js';
import { execWarpscript } from '@clevercloud/client/esm/request-warp10.superagent.js';
import { prefixUrl } from '@clevercloud/client/esm/prefix-url.js';
import { request } from '@clevercloud/client/esm/request.fetch.js';
import { subtle as cryptoSuble } from 'node:crypto';

// Required for @clevercloud/client with "old" Node.js
globalThis.crypto = {
  subtle: cryptoSuble,
};

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

export function processError (error) {
  const code = error.code ?? error?.cause?.code;
  if (code === 'EAI_AGAIN') {
    throw new Error('Cannot reach the Clever Cloud API, please check your internet connection.', { cause: error });
  }
  if (code === 'ECONNRESET') {
    throw new Error('The connection to the Clever Cloud API was closed abruptly, please try again.', { cause: error });
  }
  throw error;
}

export function sendToWarp10 (requestParams) {
  return Promise.resolve(requestParams)
    .then(prefixUrl(conf.WARP_10_EXEC_URL))
    .then((requestParams) => execWarpscript(requestParams, { retry: 1 }));
}

export async function getHostAndTokens () {
  const tokens = await loadTokens();
  return {
    apiHost: conf.API_HOST,
    tokens,
  };
}
