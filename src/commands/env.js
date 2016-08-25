var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Env = require("../models/env.js");
var Git = require("../models/git.js")(path.resolve("."));

var env = module.exports;

var renderEnvVariables = env.renderEnvVariables = function(list, addExport) {
  Logger.println(_.map(list, function(x) {
    if(addExport) {
      return "export " + x.name + "='" + x.value.replace(/'/g, "'\\''") + "';";
    } else {
      return x.name + "=" + x.value;
    }
  }).join('\n'));
};

var readEnvVariablesFromStdin = env.readEnvVariablesFromStdin = function() {
  return Bacon.fromBinder(function(sink) {
    var readline = require('readline');
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    var pairs = [];

    rl.on('line', function(line){
      var res = Env.parseEnvLine(line);
      if(res) {
        pairs.push(res);
      }
    });

    rl.on('close', function(){
      sink(new Bacon.Next(pairs));
      sink(new Bacon.End());
    });
  });
};

var list = env.list = function(api, params) {
  var alias = params.options.alias;
  var addExport = params.options["add-export"];

  var s_appData = AppConfig.getAppData(alias).toProperty();

  var s_env = s_appData.flatMap(function(appData) {
    return Env.list(api, appData.app_id, appData.org_id);
  });

  var s_env_from_addons = s_appData.flatMap(function(appData) {
    return Env.listFromAddons(api, appData.app_id, appData.org_id);
  });

  var s_fullEnv = s_env.flatMapLatest(function(env) {
    return s_env_from_addons.flatMapLatest(function(env_from_addons) {
      return {
        manual: env,
        addons: env_from_addons
      };
    });
  });

  s_fullEnv.onValue(function(envs) {
    Logger.println("# Manually set env variables");
    renderEnvVariables(envs.manual, addExport);

    _.each(envs.addons, function(addon) {
      Logger.println("# Addon " + addon.addon_name);
      renderEnvVariables(addon.env, addExport);
    });
  });

  s_fullEnv.onError(Logger.error);
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
    Logger.println("Your environment variable has been successfully saved");
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
    Logger.println("Your environment variable has been successfully removed");
  });

  s_env.onError(Logger.error);
};

var importEnv = env.importEnv = function(api, params) {
  var name = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_pairs = readEnvVariablesFromStdin();

  const s_result = s_pairs.flatMapLatest(function(pairs) {
    return s_appData.flatMap(function(appData) {
      return Env.bulkSet(api, pairs, appData.app_id, appData.org_id);
    });
  });

  s_result.onValue(function() {
    Logger.println("Environment variables have been set");
  });

  s_result.onError(Logger.error);
};
