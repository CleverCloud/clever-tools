var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Event = module.exports;

Event.getEventsFromWS = function(url, authorization) {
  Logger.debug("Opening a websocket in order to fetch events…")
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

    ws.on("error", function() {
      Logger.debug("Websocket closed.");
      sink(new Bacon.End());
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

Event.getEvents = function(api, appId) {
  var url = conf.EVENT_URL;
  return Event.getEventsFromWS(url, api.session.getAuthorization('GET', conf.API_HOST + '/events/', {}))
        .map(function(event) {
          try {
            var data = JSON.parse(event.data);
            event.data = data;
            return event;
          } catch(e) {
            return event;
          }
        })
        .filter(function(event) {
          return event.data &&
                (event.data.id    === appId ||
                 event.data.appId === appId);
        });
};
