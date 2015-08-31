var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");

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
  return Log.getLogsFromWS(url, api.session.getAuthorization());
};

Log.getOldLogs = function(api, app_id) {
  var s_res= Bacon.fromNodeCallback(request, {
      url: "https://logs-api.clever-cloud.com/logs/" + app_id,
      qs: { limit: 300 },
      headers: {
        authorization: api.session.getAuthorization(),
        "Accept": "application/json"
      }
  })
  return s_res.flatMapLatest(function(res) {
    return Bacon.fromArray(JSON.parse(res.body).reverse());
  });
}

Log.getAppLogs = function(api, appId) {
  return Log.getOldLogs(api, appId)
        .merge(Log.getNewLogs(api, appId))
        .map(function(line) {
          return line._source["@timestamp"] + ": " + line._source["@message"];
        });
};
