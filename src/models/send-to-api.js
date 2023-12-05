'use strict';

const Logger = require('../logger.js');
const { addOauthHeader } = require('@clevercloud/client/cjs/oauth.js');
const { conf, loadOAuthConf } = require('../models/configuration.js');
const { execWarpscript } = require('@clevercloud/client/cjs/request-warp10.superagent.js');
const { prefixUrl } = require('@clevercloud/client/cjs/prefix-url.js');
const { request } = require('@clevercloud/client/cjs/request.fetch.js');

async function loadTokens () {
  const tokens = await loadOAuthConf();
  return {
    OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: tokens.token,
    API_OAUTH_TOKEN_SECRET: tokens.secret,
  };
}

async function sendToApi (requestParams) {
  const tokens = await loadTokens();
  return Promise.resolve(requestParams)
    .then(prefixUrl(conf.API_HOST))
    .then(addOauthHeader(tokens))
    .then((requestParams) => {
      if (process.env.CLEVER_VERBOSE) {
        Logger.debug(`${requestParams.method.toUpperCase()} ${requestParams.url} ? ${JSON.stringify(requestParams.queryParams)}`);
      }
      return requestParams;
    })
    .then(request)
    .catch(processError);
}

function processError (error) {
  const code = error.code ?? error?.cause?.code;
  if (code === 'EAI_AGAIN') {
    throw new Error('Cannot reach the Clever Cloud API, please check your internet connection.', { cause: error });
  }
  if (code === 'ECONNRESET') {
    throw new Error('The connection to the Clever Cloud API was closed abruptly, please try again.', { cause: error });
  }
  throw error;
}

function sendToWarp10 (requestParams) {
  return Promise.resolve(requestParams)
    .then(prefixUrl(conf.WARP_10_EXEC_URL))
    .then((requestParams) => execWarpscript(requestParams, { retry: 1 }));
}

async function getHostAndTokens () {
  const tokens = await loadTokens();
  return {
    apiHost: conf.API_HOST,
    tokens,
  };
}

module.exports = { sendToApi, sendToWarp10, getHostAndTokens, processError };
