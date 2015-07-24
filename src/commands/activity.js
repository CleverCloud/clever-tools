var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var colors = require("colors");
var moment = require("moment");

var Activity = require("../models/activity.js");
var AppConfig = require("../models/app_configuration.js");

var Logger = require("../logger.js");

var displayState = function(state, isFirst) {
  switch(state) {
    case "OK":        return "OK         ".bold.green;
    case "FAIL":      return "FAIL       ".bold.red;
    case "CANCELLED": return "CANCELLED  ".bold.red;
    case "WIP":
      if(isFirst) {
                      return "IN PROGRESS".bold.blue;
      } else {
                      return "FAIL       ".bold.red;
      }
    default:
      Logger.warn("Unknown deployment state: " + state);
                      return "UNKNOWN    ";
  }
};
var unspecifiedCommitId = _.padRight("not specified", 40); // a git commit id is 40 chars long

var activity = module.exports = function(api, params) {
  var alias = params.options.alias;
  var showAll = params.options["show-all"];
  var s_appData = AppConfig.getAppData(alias);

  var s_activity = s_appData.flatMapLatest(function(appData) {
    return Activity.list(api, appData.app_id, appData.org_id, showAll);
  });

  s_activity.onValue(function(deployments) {
    console.log(deployments.map(function(deployment, index) {
      return moment(deployment.date).format() + " - " +
             displayState(deployment.state, index == 0) + " " +
             _.padRight(deployment.action, 8) + " " +
             (deployment.commit || unspecifiedCommitId) + " " +
             deployment.cause;
    }).join('\n'));
  });
  s_activity.onError(Logger.error);
};
