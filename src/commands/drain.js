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
    Logger.println(_.map(drains, 'drain').join('\n'));
  });

  s_drain.onError(Logger.error);
};

var add = drain.add = function(api, params) {
  var drainTargetURL = params.args[0];
  var drainTargetType = params.args[1];
  var drainTargetCredentials = params.options.credentials;
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
