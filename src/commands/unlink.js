var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

var unlink = module.exports = function(api, params) {
  var alias = params.args[0];

  var s_appData = AppConfig.getAppData(alias).toProperty();

  var s_result = s_appData.flatMapLatest(function(appData) {
    return Application.unlinkRepo(api, appData.alias);
  })

  s_result.onValue(function(app) {
    Logger.println("Your application has been successfully unlinked!");
  });

  s_result.onError(Logger.error);
};
