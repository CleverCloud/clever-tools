var WebSocket = require("ws");
var Bacon = require("baconjs");
var _ = require("lodash");

var Logger = require("../logger.js");
var { conf } = require('./configuration.js');
var WsStream = require("./ws-stream.js");

var Event = module.exports;

Event.getEvents = function(api, appId) {
  var url = conf.EVENT_URL;
  return WsStream.openStream(_.constant(url), api.session.getAuthorization('GET', conf.API_HOST + '/events/', {}))
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
