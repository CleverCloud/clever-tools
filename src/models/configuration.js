var fs = require("fs");
var path = require("path");
var xdg = require("xdg");

var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");
var env = require("common-env")(Logger);

var getConfigPath = function() {
  if(process.platform === 'win32') {
    return path.resolve(process.env.APPDATA, "clever-cloud");
  } else {
    return xdg.basedir.configPath("clever-cloud");
  }
};

var conf = module.exports = env.getOrElseAll({
  API_HOST: "https://api.clever-cloud.com/v2",
  LOG_WS_URL: "wss://api.clever-cloud.com/v2/logs/logs-socket/<%- appId %>?since=<%- timestamp %>",
  LOG_HTTP_URL: "https://api.clever-cloud.com/v2/logs/<%- appId %>",
  EVENT_URL: "wss://api.clever-cloud.com/v2/events/event-socket",
  OAUTH_CONSUMER_KEY: "T5nFjKeHH4AIlEveuGhB5S3xg8T19e",
  OAUTH_CONSUMER_SECRET: "MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT",
  SSH_GATEWAY: "ssh@sshgateway-clevercloud-customers.services.clever-cloud.com",

  CONFIGURATION_FILE: getConfigPath(),
  CONSOLE_TOKEN_URL: "https://console.clever-cloud.com/cli-oauth",

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
    Logger.info("Cannot load configuration from " + conf.CONFIGURATION_FILE + " (" + error + ")");
    return {};
  });
};
