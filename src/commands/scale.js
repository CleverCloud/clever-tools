var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");

var Logger = require("../logger.js");

var scale = module.exports = function(api, params) {
  if (params.options["min-flavor"] == null && params.options["max-flavor"] == null &&
      params.options["min-instances"] == null && params.options["max-instances"] == null) {
    return Logger.error("You should provide at least 1 option")
  }

  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_scaledApp = s_appData.flatMapLatest(function(appData) {
    var scalabilityParameters = {};
    scalabilityParameters.minFlavor = params.options["min-flavor"];
    scalabilityParameters.maxFlavor = params.options["max-flavor"];
    scalabilityParameters.minInstances = params.options["min-instances"];
    scalabilityParameters.maxInstances = params.options["max-instances"];

    return Application.setScalability(api, appData.app_id, appData.org_id,scalabilityParameters);
  });

  s_scaledApp.onValue(function(___) {
    Logger.println("App rescaled successfully");
  });
  s_scaledApp.onError(Logger.error);
};
