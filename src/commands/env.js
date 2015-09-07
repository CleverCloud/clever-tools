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
  var addExport = params.options["add-export"];

  var s_appData = AppConfig.getAppData(alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.list(api, appData.app_id, appData.org_id);
  });

  s_env.onValue(function(envs) {
    console.log(_.map(envs, function(x) {
      if(addExport) {
        return "export " + x.name + "='" + x.value.replace(/'/g, "'\\''") + "'";
      } else {
        return x.name + "=" + x.value;
      }
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

var importEnv = env.importEnv = function(api, params) {
  var name = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var readline = require('readline');
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  var pairs = [];

  rl.on('line', function(line){
    var p = line.split('=');
    pairs.push(_.map(line.split('='), function(x) { return x.trim(); }));
  });

  rl.on('close', function(){
    var s_env = s_appData.flatMap(function(appData) {

      return Env.bulkSet(api, pairs, appData.app_id, appData.org_id);
    });

    s_env.onValue(function() {
      console.log("Environment variables have been set");
    });

    s_env.onError(Logger.error);
  });


};
