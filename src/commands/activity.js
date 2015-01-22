var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var Activity = require("../models/activity.js");
var AppConfig = require("../models/app_configuration.js");

var Logger = require("../logger.js");

var activity = module.exports = function(api, params) {
  var alias = params.options.alias;
  var s_appData = AppConfig.getAppData(alias);

  var s_activity = s_appData.flatMapLatest(function(appData) {
    return Activity.list(api, appData.app_id, appData.org_id);
  });

  s_activity.onValue(function(deployments) {
    console.log(deployments.map(function(deployment) {
      return deployment.action +
        " (" + deployment.state + ")" +
        " Cause: " + deployment.cause +
        " Commit: " + deployment.commit;
    }).join('\n'));
  });
  s_activity.onError(Logger.error);
};
