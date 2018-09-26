'use strict';

const _ = require('lodash');
const cleverClient = require('clever-client');

const Logger = require('../logger.js');
const { conf, loadOAuthConf } = require('./configuration.js');

function initApi () {

  return loadOAuthConf()
    .map((tokens) => {

      tokens.token = process.env.CLEVER_TOKEN;
      tokens.secret = process.env.CLEVER_SECRET;

      const api = cleverClient(_.defaults(conf, {
        API_HOST: conf.API_HOST,
        API_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
        API_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
        API_OAUTH_TOKEN: tokens.token,
        API_OAUTH_TOKEN_SECRET: tokens.secret,
        logger: Logger,
      }));

      // Waiting for clever-client to be fully node compliant
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
