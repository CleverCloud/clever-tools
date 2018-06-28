var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var colors = require("colors");
var moment = require("moment");

var handleCommandStream = require('../command-stream-handler');
var Activity = require("../models/activity.js");
var Event = require("../models/events.js");
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
var unspecifiedCommitId = _.padEnd("not specified", 40); // a git commit id is 40 chars long

var renderActivityLine = function(deployment, isFirst) {
  return moment(deployment.date).format() + " - " +
         displayState(deployment.state, isFirst) + " " +
         _.padEnd(deployment.action, 9) + " " + // longest action name is downscale
         (deployment.commit || unspecifiedCommitId) + " " +
         deployment.cause;
};

var activity = module.exports = function(api, params) {
  var alias = params.options.alias;
  var showAll = params.options["show-all"];
  var follow = params.options.follow;
  var s_appData = AppConfig.getAppData(alias);

  var s_activity = s_appData.flatMapLatest(function(appData) {
    return Activity.list(api, appData.app_id, appData.org_id, showAll);
  }).map(function(x) { return x.reverse(); });

  if(!follow) {
    s_activity.onValue(function(deployments) {
      Logger.println(deployments.map(function(deployment, index) {
        return renderActivityLine(deployment, index == deployments.length - 1);
      }).join('\n'));
    });
    s_activity.onError(Logger.error);
  } else {
    var s_events = s_appData.flatMapLatest(function(appData) {
      return Event.getEvents(api, appData.app_id);
    });

    var s_activityEvents = s_events
    .filter(function(event) {
      return event.event === 'DEPLOYMENT_ACTION_BEGIN' ||
        event.event === 'DEPLOYMENT_ACTION_END';
    })
    .map(function(event) {
      return {
        type: event.event,
        date: event.date,
        state: event.data.state,
        action: event.data.action,
        commit: event.data.commit,
        cause: event.data.cause
      };
    });

    var s_newLines = s_activity
                    .flatMapLatest(Bacon.fromArray)
                    .merge(s_activityEvents)
                    .slidingWindow(2,1);

    handleCommandStream(s_newLines, function(events) {
      var event;
      if(events.length === 1) {
        event = events[0];
      } else if(events.length === 2) {
        event = events[1];
      } else {
        return;
      }

      if(event.type === 'DEPLOYMENT_ACTION_END') {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        event.action = events[0].action;
      } else if(events.length > 1) {
        process.stdout.write("\n");
      }

      process.stdout.write(renderActivityLine(event, true));

    });
  }
};
