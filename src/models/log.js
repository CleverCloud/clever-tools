var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");
var colors = require("colors");

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Log = module.exports;

Log.getLogsFromWS = function(url, authorization) {
  return Bacon.fromBinder(function(sink) {
    var ws = new WebSocket(url);

    ws.on("open", function open() {
      Logger.debug("Websocket opened successfully.");
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

    ws.on("error", function() {
      Logger.debug("Websocket closed.");
      sink(new Bacon.End());
    });

    return function() {
      ws.close();
    };
  });
};

Log.getWsLogUrl = _.partial(function(template, appId, timestamp) {
  return template({
    appId: appId,
    timestamp: timestamp
  });
}, _.template(conf.LOG_WS_URL));

Log.getHttpLogUrl = _.partial(function(template, appId) {
  return template({
    appId: appId
  });
}, _.template(conf.LOG_HTTP_URL));

/** Get logs as they arrive from a web socket.
 * Automatically reconnect if the connexion is closed.
 *
 * api: The API object
 * appId: The appId of the application
 * before (Date): only display log lines that happened before this date
 * after  (Date): only display log lines that happened after this date
 */
Log.getContinuousLogs = function(api, appId, before, after){
  var url = Log.getWsLogUrl(appId, after.toISOString());
  var s_WsLogs = Log.getLogsFromWS(url, api.session.getAuthorization('GET', conf.API_HOST + '/logs/' + appId, {}))
  var s_logs = s_WsLogs.filter(function(line) {
    var lineDate = Date.parse(line._source["@timestamp"]);
    var isBefore = !before || lineDate < before.getTime();
    var isAfter = !after || lineDate > after.getTime();
    return isBefore && isAfter;
  });

  var s_end = s_logs
    .filter(false)
    .mapEnd(new Date());

  var s_interruption = s_end.flatMapLatest(function(endTimestamp){
    Logger.warn("Websocket has been closed, reconnecting…");
    var newAfter = after.getTime() > endTimestamp.getTime() ? after : endTimestamp;
    return Bacon.later(1500, null).flatMapLatest(function() {
      return Log.getContinuousLogs(api, appId, before, newAfter);
    });
  });

  return Bacon.mergeAll(s_logs, s_interruption);
};

Log.getNewLogs = function(api, appId, before, after) {
  Logger.println("Waiting for application logs…");
  Logger.debug("Opening a websocket in order to fetch logs…");

  return Log.getContinuousLogs(api, appId, before, after);
};

Log.getOldLogs = function(api, app_id, before, after) {
  var query = {};

  if(!before && !after) {
    query.limit = 300;
  } else {
    if(before) query.before = before.toISOString();
    if(after) query.after = after.toISOString();
  }

  var s_res = Bacon.fromNodeCallback(request, {
      agent: new (require("https").Agent)({ keepAlive: true }),
      url: Log.getHttpLogUrl(app_id),
      qs: query,
      headers: {
        authorization: api.session.getAuthorization('GET', conf.API_HOST + '/logs/' + app_id, {}),
        "Accept": "application/json"
      }
  });

  return s_res.flatMapLatest(function(res) {
    Logger.debug("Received old logs");
    var jsonBody = _.attempt(JSON.parse, res.body);
    if(!_.isError(jsonBody) && _.isArray(jsonBody)) {
      return Bacon.fromArray(jsonBody.reverse());
    } else {
      if(!_.isError(jsonBody) && jsonBody["type"] === "error") {
        return new Bacon.Error(jsonBody);
      } else {
        return new Bacon.Error("Received invalid JSON");
      }
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

var isBuildSucessMessage = function(line){
  return _.startsWith(line._source["@message"].toLowerCase(), "build succeeded in");
};

Log.getAppLogs = function(api, appId, instances, before, after) {
  var s_logs;
  var now = new Date();

  var fetchOldLogs = !after || after < now;
  var fetchNewLogs = !before || before > now;

  if(fetchOldLogs) {
    s_logs = Log.getOldLogs(api, appId, before, after)
            .merge(Log.getNewLogs(api, appId, before, after || now));
  } else {
    s_logs = Log.getNewLogs(api, appId, before, after || now);
  }
  return s_logs
        .filter(function(line) {
          return !instances || instances.indexOf(line._source["@source_host"]) >= 0;
        })
        .map(function(line) {
          if(isDeploymentSuccessMessage(line)) {
            return line._source["@timestamp"] + ": " + line._source["@message"].bold.green;
          } else if(isDeploymentFailedMessage(line)) {
            return line._source["@timestamp"] + ": " + line._source["@message"].bold.red;
          } else if(isBuildSucessMessage(line)){
            return line._source["@timestamp"] + ": " + line._source["@message"].bold.blue;
          } else {
            return line._source["@timestamp"] + ": " + line._source["@message"];
          }
        });
};
