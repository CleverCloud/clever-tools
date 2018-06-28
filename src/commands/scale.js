var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var handleCommandStream = require('../command-stream-handler');
var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");

var Logger = require("../logger.js");

var scale = module.exports = function(api, params) {
  if (params.options["min-flavor"] == null && params.options["max-flavor"] == null &&
      params.options["min-instances"] == null && params.options["max-instances"] == null &&
      params.options["flavor"] == null && params.options["instances"] == null) {
    return Logger.error("You should provide at least 1 option")
  }

  if (params.options["flavor"]) {
    if (params.options["min-flavor"] || params.options["max-flavor"])
      return Logger.error("You can't use --flavor and --min-flavor or --max-flavor at the same time");
    params.options["min-flavor"] = params.options["flavor"];
    params.options["max-flavor"] = params.options["flavor"];
  }

  if (params.options["instances"]) {
    if (params.options["min-instances"] || params.options["max-instances"])
      return Logger.error("You can't use --instances and --min-instances or --max-instances at the same time");
    params.options["min-instances"] = params.options["instances"];
    params.options["max-instances"] = params.options["instances"];
  }

  if (params.options["min-instances"] && params.options["max-instances"] &&
      params.options["min-instances"] > params.options["max-instances"]) {
    return Logger.error("min-instances can't be greater than max-instances");
  }

  if (params.options["min-flavor"] && params.options["max-flavor"] &&
      Application.listAvailableFlavors().indexOf(params.options["min-flavor"]) >
      Application.listAvailableFlavors().indexOf(params.options["max-flavor"])) {
    return Logger.error("min-flavor can't be a greater flavor than max-flavor");
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

  handleCommandStream(s_scaledApp, () => Logger.println("App rescaled successfully"));
};
