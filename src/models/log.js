var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");

var debug = _.partial(console.log.bind(console), "[LOG]");
var error = _.partial(console.error.bind(console), "[ERROR]");

var Log = module.exports;

Log.getLogsFromWS = function(url, authorization) {
  debug("Opening a websocket in order to fetch logs…")
  return Bacon.fromBinder(function(sink) {
    var ws = new WebSocket(url);

    ws.on("open", function open() {
      debug("Websocket opened successfully.")
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
      debug("Websocket closed.");
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
