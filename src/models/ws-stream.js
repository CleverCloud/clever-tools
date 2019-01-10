'use strict';

const Bacon = require('baconjs');
const WebSocket = require('ws');

const Logger = require('../logger.js');

const RETRY_DELAY = 1500;
const MAX_RETRY_COUNT = 5;
const PING_INTERVAL = 40000;

function openWebSocket (url, authorization) {
  return Bacon.fromBinder((sink) => {
    const ws = new WebSocket(url);
    let pingInterval;

    ws.on('open', () => {
      Logger.debug('WebSocket opened successfully: ' + url);
      // TODO, we're investigating sending a success/error response from the server side through the WS
      ws.send(JSON.stringify({
        message_type: 'oauth',
        authorization: authorization,
      }));
      pingInterval = setInterval(() => ws.send('["ping"]'), PING_INTERVAL);
    });

    ws.on('message', (data) => {
      try {
        sink(JSON.parse(data));
      }
      catch (e) {
        sink(new Bacon.Error(e));
      }
    });

    ws.on('close', () => {
      Logger.debug('WebSocket closed.');
      clearInterval(pingInterval);
      sink(new Bacon.End());
    });

    ws.on('error', () => {
      Logger.debug('WebSocket error.');
      clearInterval(pingInterval);
      sink(new Bacon.Error('WebSocket error.'));
    });

    return function () {
      ws.close();
    };
  });
}

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
function openStream (makeUrl, authorization, endTimestamp, retries = MAX_RETRY_COUNT) {
  const endTs = endTimestamp || null;
  const s_websocket = openWebSocket(makeUrl(endTs), authorization);

  // Stream which contains only one element: the date at which the websocket closed
  const s_endTimestamp = s_websocket.filter(false).mapEnd(new Date());
  const s_interruption = s_endTimestamp.flatMapLatest((endTimestamp) => {
    Logger.warn('WebSocket connexion closed, reconnecting...');
    if (retries === 0) {
      return new Bacon.Error(`WebSocket connexion failed ${MAX_RETRY_COUNT} times!`);
    }
    return Bacon.later(RETRY_DELAY, null).flatMapLatest(() => {
      return openStream(makeUrl, authorization, endTimestamp, retries - 1);
    });
  });

  return Bacon.mergeAll(s_websocket, s_interruption);
}

module.exports = {
  openStream,
};
