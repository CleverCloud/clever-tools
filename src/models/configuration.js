var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var conf = module.exports = {
  API_HOST: "https://api.clever-cloud.com/v2",
  OAUTH_CONSUMER_KEY: "DVXgEDKLATkZkSRqN7iQ0KwWSvtNaD",
  OAUTH_CONSUMER_SECRET: "GPKbDuphYWFr3faS5dg64eCjsrpxGY",

  CONFIGURATION_FILE: path.resolve(process.env.HOME, ".cleverrc"),
  CONSOLE_TOKEN_URL: "http://console3.local:8080/users/me/tokens"
};

conf.loadOAuthConf = function() {
  debug("Load configuration from " + conf.CONFIGURATION_FILE);
  var s_oauthData = Bacon.fromNodeCallback(_.partial(fs.readFile, conf.CONFIGURATION_FILE)).flatMapLatest(function(content) {
    try {
      return Bacon.once(JSON.parse(content));
    }
    catch(e) {
      return new Bacon.Error(e);
    }
  });

  return s_oauthData.mapError(function(error) {
    debug("Cannot load configuration from " + conf.CONFIGURATION_FILE);
    return {};
  });
};
