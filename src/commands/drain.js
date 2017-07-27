var _ = require("lodash");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Drain = require("../models/drain.js");

var drain = module.exports;

var list = drain.list = function(api, params) {
  var alias = params.options.alias;
  
  var s_appData = AppConfig.getAppData(alias);

  var s_drain = s_appData.flatMap(function(appData) {
    return Drain.list(api, appData.app_id);
  });

  s_drain.onValue(function(drains) {
    _.map(drains, function(drain) {
      Logger.println(drain.id + " -> " + drain.state + " for " + drain.target.url + " as " + drain.target.drainType)
    });
  });

  s_drain.onError(Logger.error);
};

var create = drain.create = function(api, params) {
  var drainTargetType = params.args[0];
  var drainTargetURL = params.args[1];
  var drainTargetCredentials = {
    "username": params.options.username,
    "password": params.options.password
  }
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_drain = s_appData.flatMap(function(appData) {
    return Drain.create(api, appData.app_id, drainTargetURL, drainTargetType, drainTargetCredentials);
  });

  s_drain.onValue(function() {
    Logger.println("Your drain has been successfully saved");
  });

  s_drain.onError(Logger.error);
};

var rm = drain.rm = function(api, params) {
  var drainId = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_drain = s_appData.flatMap(function(appData) {
    return Drain.remove(api, appData.app_id, drainId);
  });

  s_drain.onValue(function() {
    Logger.println("Your drain has been successfully removed");
  });

  s_drain.onError(Logger.error);
};

var enable = drain.enable = function(api, params) {
  var drainId = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_drain = s_appData.flatMap(function(appData) {
    return Drain.enable(api, appData.app_id, drainId);
  });

  s_drain.onValue(function() {
    Logger.println("Your drain has been enabled");
  });

  s_drain.onError(Logger.error);
};

var rdisable = drain.disable = function(api, params) {
  var drainId = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_drain = s_appData.flatMap(function(appData) {
    return Drain.disable(api, appData.app_id, drainId);
  });

  s_drain.onValue(function() {
    Logger.println("Your drain has been disabled");
  });

  s_drain.onError(Logger.error);
};