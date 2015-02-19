var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");
var env = require("common-env")(Logger);

var conf = module.exports = env.getOrElseAll({
  API_HOST: "https://api.clever-cloud.com/v2",
  LOG_URL: "wss://logs-api.clever-cloud.com/logs-socket/<%- appId %>?since=<%- timestamp %>",
  OAUTH_CONSUMER_KEY: "DVXgEDKLATkZkSRqN7iQ0KwWSvtNaD",
  OAUTH_CONSUMER_SECRET: "GPKbDuphYWFr3faS5dg64eCjsrpxGY",

  CONFIGURATION_FILE: path.resolve(process.env.HOME, ".cleverrc"),
  CONSOLE_TOKEN_URL: "https://console.clever-cloud.com/users/me/tokens?tokens-for=cli",

  CLEVER_CONFIGURATION_DIR: path.resolve(".", "clevercloud"),
  APP_CONFIGURATION_FILE: path.resolve(".", ".clever.json")
});

conf.loadOAuthConf = function() {
  Logger.debug("Load configuration from " + conf.CONFIGURATION_FILE);
  var s_oauthData = Bacon.fromNodeCallback(_.partial(fs.readFile, conf.CONFIGURATION_FILE)).flatMapLatest(function(content) {
    try {
      return Bacon.once(JSON.parse(content));
    }
    catch(e) {
      return new Bacon.Error(e);
    }
  });

  return s_oauthData.mapError(function(error) {
    Logger.warn("Cannot load configuration from " + conf.CONFIGURATION_FILE + " (" + error + ")");
    return {};
  });
};
