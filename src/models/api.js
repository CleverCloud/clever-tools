var _ = require("lodash");
var conf = require("./configuration.js");
var Logger = require("../logger.js");

module.exports = function() {
  var s_oauthData = conf.loadOAuthConf();

  var s_api = s_oauthData.map(function(tokens) {
    var userTokens = {
      API_OAUTH_TOKEN: tokens.token,
      API_OAUTH_TOKEN_SECRET: tokens.secret
    };

    var api = require("clever-client")(_.defaults(conf, {
      API_HOST: conf.API_HOST,
      API_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
      API_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
      logger: Logger
    }, userTokens));

    // Waiting for clever-client to be fully node compliant
    api.session.getAuthorization = function(httpMethod, url, params) {
      return api.session.getHMACAuthorization(httpMethod, url, params, userTokens);
    };

    return api;
  });

  return s_api;
};
