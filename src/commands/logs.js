var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var handleCommandStream = require('../command-stream-handler');
var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");
var Log = require("../models/log.js");

var Logger = require("../logger.js");

var appLogs = module.exports = function(api, params) {
  var alias = params.options.alias;
  var before = params.options.before;
  var after = params.options.after;
  const search = params.options.search;
  const deploymentId = params.options["deployment-id"];
  const addonId = params.options["addon"];

  let s_logs;
  if (addonId) {
    s_logs = Log.getAppLogs(api, addonId, null, before, after, search, deploymentId);
  } else {
    s_logs = AppConfig.getAppData(alias).flatMapLatest(function(app_data) {
      return Log.getAppLogs(api, app_data.app_id, null, before, after, search, deploymentId);
    });
  }
  handleCommandStream(s_logs, Logger.println)
};
