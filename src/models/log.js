var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");
var colors = require("colors");

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Log = module.exports;

Log.getLogsFromWS = function(url, authorization) {
  Logger.println("Waiting for application logs…");
  Logger.debug("Opening a websocket in order to fetch logs…")
  return Bacon.fromBinder(function(sink) {
    var ws = new WebSocket(url);

    ws.on("open", function open() {
      Logger.debug("Websocket opened successfully.")
      ws.send(JSON.stringify({
        message_type: "oauth",
        authorization: authorization
      }));
    });

    ws.on("message", function(data, flags) {
      try {
        sink(JSON.parse(data));
      }
      catch(e) {
        sink(new Bacon.Error(e));
      }
    });

    ws.on("close", function() {
      Logger.debug("Websocket closed.");
      sink(new Bacon.End());
    });

    return function() {
      ws.close();
    };
  });
};

Log.getLogUrl = _.partial(function(template, appId, timestamp) {
  return template({
    appId: appId,
    timestamp: timestamp
  });
}, _.template(conf.LOG_URL));

Log.getNewLogs = function(api, appId) {
  var url = Log.getLogUrl(appId, new Date().toISOString());
  return Log.getLogsFromWS(url, api.session.getAuthorization('GET', conf.API_HOST + '/logs/' + appId, {}))
};

Log.getOldLogs = function(api, app_id) {
  var s_res = Bacon.fromNodeCallback(request, {
      url: "https://logs-api.clever-cloud.com/logs/" + app_id,
      qs: { limit: 300 },
      headers: {
        authorization: api.session.getAuthorization('GET', conf.API_HOST + '/logs/' + app_id, {})
        "Accept": "application/json"
      }
  });

  return s_res.flatMapLatest(function(res) {
    Logger.debug("Received old logs");
    var jsonBody = _.attempt(JSON.parse, res.body);
    if(_.isError(jsonBody)) {
      return new Bacon.Error("Received invalid JSON");
    } else {
      return Bacon.fromArray(jsonBody.reverse());
    }
  });
};

var isCleverMessage = function(line) {
  return line._source.syslog_program === "/home/bas/rubydeployer/deployer.rb";
};

var isDeploymentSuccessMessage = function(line) {
  return isCleverMessage(line) &&
  _.startsWith(line._source["@message"].toLowerCase(), "successfully deployed in");
};

var isDeploymentFailedMessage = function(line) {
  return isCleverMessage(line) &&
  _.startsWith(line._source["@message"].toLowerCase(), "deploy failed in");
};

Log.getAppLogs = function(api, appId, fetchOldLogs) {
  var s_logs;
  if(fetchOldLogs) {
    s_logs = Log.getOldLogs(api, appId)
            .merge(Log.getNewLogs(api, appId));
  } else {
    s_logs = Log.getNewLogs(api, appId);
  }
  return s_logs
        .map(function(line) {
          if(isDeploymentSuccessMessage(line)) {
            return line._source["@timestamp"] + ": " + line._source["@message"].bold.green;
          } else if(isDeploymentFailedMessage(line)) {
            return line._source["@timestamp"] + ": " + line._source["@message"].bold.red;
          } else {
            return line._source["@timestamp"] + ": " + line._source["@message"];
          }
        });
};
