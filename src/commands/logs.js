var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");
var Log = require("../models/log.js");

var Logger = require("../logger.js");

var appLogs = module.exports = function(api, params) {
  var alias = params.options.alias;
  var before = params.options.before;
  var after = params.options.after;

  var s_appData = AppConfig.getAppData(alias);

  var s_logs = s_appData.flatMapLatest(function(app_data) {
    return Log.getAppLogs(api, app_data.app_id, null, before, after);
  });

  s_logs.onValue(Logger.println);
  s_logs.onError(Logger.error);
};
