var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Log = module.exports;

Log.getLogsFromWS = function(url, authorization) {
  console.log("Waiting for application logs…");
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

Log.getAppLogs = function(appId, authorization) {
  var url = Log.getLogUrl(appId, new Date().toISOString());
  return Log.getLogsFromWS(url, authorization);
};
