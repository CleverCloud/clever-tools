var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");

var app_delete = module.exports = function(api, params) {
  var alias = params.options.alias;
  var skipConfirmation = params.options.yes;

  var s_appData = AppConfig.getAppData(alias).toProperty();

  var s_delete = s_appData.flatMapLatest(function(app_data) {
    return Application.adelete(api, app_data, skipConfirmation);
  });

  s_delete.onValue(function() {
    Logger.println("The application has been deleted")
  });
  s_delete.onError(Logger.error);
};


