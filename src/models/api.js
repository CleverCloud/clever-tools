var _ = require("lodash");
var conf = require("./configuration.js");

module.exports = function() {
  var s_oauthData = conf.loadOAuthConf();

  var s_authorization = s_oauthData.map(function(oauthData) {
    var data = {
      realm: conf.API_HOST,
      oauth_consumer_key: conf.OAUTH_CONSUMER_KEY,
      oauth_token: oauthData.token,
      oauth_signature_method: "PLAINTEXT",
      oauth_signature: conf.OAUTH_CONSUMER_SECRET + "&" + oauthData.secret,
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_nonce: Math.floor(Math.random() * 1000000)
    };

    return "OAuth " + _.map(data, function(value, key) {
      return key + "=\"" + value + "\"";
    }).join(", ");
  });

  var s_api = s_authorization.map(function(authorization) {
    var api = require("clever-client")({
      API_HOST: conf.API_HOST,
      API_AUTHORIZATION: authorization,
      logger: console
    });

    // Waiting for clever-client to be fully node compliant
    api.session.getAuthorization = function() {
      return authorization;
    };

    return api;
  });

  return s_api;
};
