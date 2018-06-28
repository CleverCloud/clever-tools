var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var handleCommandStream = require('../command-stream-handler');
var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));
var Log = require("../models/log.js");

var Logger = require("../logger.js");

var timeout = 5 * 60 * 1000;

var stop = module.exports = function(api, params) {
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_stoppedApp = s_appData.flatMapLatest(function(appData) {
    return Application.stop(api, appData.app_id, appData.org_id);
  });

  handleCommandStream(s_stoppedApp, () => Logger.println("App successfully stopped!"));
};
