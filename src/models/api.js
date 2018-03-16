var _ = require("lodash");
var { conf, loadOAuthConf } = require('./configuration.js');
var Logger = require("../logger.js");

module.exports = function() {
  var s_oauthData = loadOAuthConf();

  var s_api = s_oauthData.map(function(tokens) {
    var api = require("clever-client")(_.defaults(conf, {
      API_HOST: conf.API_HOST,
      API_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
      API_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
      API_OAUTH_TOKEN: tokens.token,
      API_OAUTH_TOKEN_SECRET: tokens.secret,
      logger: Logger
    }));

    // Waiting for clever-client to be fully node compliant
    api.session.getAuthorization = function(httpMethod, url, params) {
      return api.session.getHMACAuthorization(httpMethod, url, params, {
        user_oauth_token: tokens.token,
        user_oauth_token_secret: tokens.secret
      });
    };

    return api;
  });

  return s_api;
};
