'use strict';

const { initCleverClient } = require('@clevercloud/client/cjs/legacy-client.node.js');
const { conf, loadOAuthConf } = require('./configuration.js');

function initApi () {
  return loadOAuthConf().map((tokens) => {
    return initCleverClient({
      API_HOST: conf.API_HOST,
      OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
      OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
      API_OAUTH_TOKEN: tokens.token,
      API_OAUTH_TOKEN_SECRET: tokens.secret,
    });
  });
};

module.exports = initApi;
