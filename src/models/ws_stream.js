'use strict';

const WebSocket = require("ws");
const Bacon = require("baconjs");
const Logger = require("../logger.js");

const WsStream = module.exports;

WsStream.openWebSocket = function(url, authorization) {
  return Bacon.fromBinder(sink => {
    const ws = new WebSocket(url);
    let pingInterval;

    ws.on("open", function open() {
      Logger.debug("Websocket opened successfully: " + url);
      ws.send(JSON.stringify({
        message_type: "oauth",
        authorization: authorization
      }));
      pingInterval = setInterval(function() {
        ws.send('["ping"]');
      }, 40000);
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
      clearInterval(pingInterval);
      sink(new Bacon.End());
    });

    ws.on("error", function() {
      Logger.debug("Websocket closed.");
      clearInterval(pingInterval);
      sink(new Bacon.End());
    });

    return function() {
      ws.close();
    };
  });
};

/**
 * Open a never-ending stream of events, backed by a websocket.
 * If websocket connection is closed, it is automatically re-opened.
 * Ping messages are regularly sent to the server to keep the connection alive and
 * avoid disconnections.
 * 
 * makeUrl: Timestamp => String :
 *   The WS URL can be constructed based on the closing date, in case the WS supports resuming.
 *   On the first WS connection, this value will be null
 * authorization: The content of the authorization message sent to server
 */
WsStream.openStream = function(makeUrl, authorization, endTimestamp) {
  const endTs = endTimestamp ? endTimestamp : null;
  const s_websocket = WsStream.openWebSocket(makeUrl(endTs), authorization);

  // Stream which contains only one element: the date at which the websocket closed
  const s_endTimestamp = s_websocket.filter(false).mapEnd(new Date());
  const s_interruption = s_endTimestamp.flatMapLatest((endTimestamp) => {
    Logger.warn("Websocket closed, reconnecting");
    return Bacon.later(1500, null).flatMapLatest(() => {
      return WsStream.openStream(makeUrl, authorization, endTimestamp);
    });
  });
  return Bacon.mergeAll(s_websocket, s_interruption);
}