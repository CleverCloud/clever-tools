'use strict';

const { addOauthHeader } = require('@clevercloud/client/cjs/oauth.node.js');
const { prefixUrl } = require('@clevercloud/client/cjs/prefix-url.js');
const { request } = require('@clevercloud/client/cjs/request.request.js');
const { conf, loadOAuthConf } = require('../models/configuration.js');

async function sendToApi (requestParams) {
  const tokens = await loadOAuthConf().toPromise();
  return Promise.resolve(requestParams)
    .then(prefixUrl(conf.API_HOST))
    .then(addOauthHeader({
      OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
      OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
      API_OAUTH_TOKEN: tokens.token,
      API_OAUTH_TOKEN_SECRET: tokens.secret,
    }))
    .then(request);
}

module.exports = { sendToApi };
