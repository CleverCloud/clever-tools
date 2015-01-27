var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Env = require("../models/env.js");
var Git = require("../models/git.js")(path.resolve("."));

var env = module.exports;

var list = env.list = function(api, params) {
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.list(api, appData.app_id, appData.org_id);
  });

  s_env.onValue(function(envs) {
    console.log(_.map(envs, function(x) {
      return x.name + "=" + x.value;
    }).join('\n'));
  });

  s_env.onError(Logger.error);
};

var set = env.set = function(api, params) {
  var name = params.args[0];
  var value = params.args[1];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.set(api, name, value, appData.app_id, appData.org_id);
  });

  s_env.onValue(function() {
    console.log("Your environment variable has been successfully saved");
  });

  s_env.onError(Logger.error);
};

var rm = env.rm = function(api, params) {
  var name = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.remove(api, name, appData.app_id, appData.org_id);
  });

  s_env.onValue(function() {
    console.log("Your environment variable has been successfully removed");
  });

  s_env.onError(Logger.error);
};
