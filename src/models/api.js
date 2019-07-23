'use strict';

const { initCleverClient } = require('@clevercloud/client/cjs/legacy-client.node.js');

const { conf, loadOAuthConf } = require('./configuration.js');

function initApi () {

  return loadOAuthConf().map((tokens) => {

    const apiSettings = {
      API_HOST: conf.API_HOST,
      OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
      OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
      API_OAUTH_TOKEN: tokens.token,
      API_OAUTH_TOKEN_SECRET: tokens.secret,
    };

    const api = initCleverClient(apiSettings);

    api.session.getAuthorization = (httpMethod, url, params) => {
      return api.session.getHMACAuthorization(httpMethod, url, params, {
        user_oauth_token: tokens.token,
        user_oauth_token_secret: tokens.secret,
      });
    };

    return api;
  });
};

module.exports = initApi;
