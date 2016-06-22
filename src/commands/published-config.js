var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Env = require("../models/env.js");
var PublishedConfig = require("../models/published-config.js");
var Git = require("../models/git.js")(path.resolve("."));

var EnvCommand = require("./env.js");

var publishedConfig = module.exports;

var list = publishedConfig.list = function(api, params) {
  var alias = params.options.alias;
  var s_appData = AppConfig.getAppData(alias).toProperty();

  var s_env = s_appData.flatMap(function(appData) {
    return PublishedConfig.list(api, appData.app_id, appData.org_id);
  });

  s_env.onValue(function(envs) {
    EnvCommand.renderEnvVariables(_.map(envs, function(v,k) {
      return { name: k, value: v };
    }), false);
  });

  s_env.onError(Logger.error);
};

var set = publishedConfig.set = function(api, params) {
  var name = params.args[0];
  var value = params.args[1];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_env = s_appData.flatMap(function(appData) {
    return PublishedConfig.set(api, name, value, appData.app_id, appData.org_id);
  });

  s_env.onValue(function() {
    Logger.println("Your published config item has been successfully saved");
  });

  s_env.onError(Logger.error);
};

var rm = publishedConfig.rm = function(api, params) {
  var name = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_env = s_appData.flatMap(function(appData) {
    return PublishedConfig.remove(api, name, appData.app_id, appData.org_id);
  });

  s_env.onValue(function() {
    Logger.println("Your published config item has been successfully removed");
  });

  s_env.onError(Logger.error);
};

var importEnv = publishedConfig.importEnv = function(api, params) {
  var name = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_pairs = EnvCommand.readEnvVariablesFromStdin();

  var s_result = s_pairs.flatMapLatest(function(pairs) {
    return s_env = s_appData.flatMap(function(appData) {
      return PublishedConfig.bulkSet(api, pairs, appData.app_id, appData.org_id);
    });
  });

  s_result.onValue(function() {
    Logger.println("Published config items have been set");
  });

  s_result.onError(Logger.error);
};
