var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var AppConfig = require("./models/app_configuration.js");
var Deployment = require("./models/deployment.js");

var Logger = require("./logger.js");

var cancelDeployment = module.exports = function(api, params) {
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_cancel = s_appData.flatMapLatest(function(appData) {
    return Deployment.last(api, appData.app_id, appData.org_id).flatMapLatest(function(deployments) {
      return Deployment.cancel(api, _.head(deployments) || {}, appData.app_id, appData.org_id);
    });
  });

  s_cancel.onValue(function(___) {
    console.log("Deployment cancelled!");
  });
  s_cancel.onError(Logger.error);
};
