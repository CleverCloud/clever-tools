var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");

var Logger = require("../logger.js");

var Log = module.exports;

Log.getLogsFromWS = function(url, authorization) {
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

Log.getAppLogs = function(appId, authorization) {
  return Log.getLogsFromWS("wss://logs-api.clever-cloud.com/logs-socket/" + appId + "?since=" + new Date().toISOString(), authorization);
};
