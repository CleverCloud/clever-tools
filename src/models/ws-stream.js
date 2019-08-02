'use strict';

const Bacon = require('baconjs');
const WebSocket = require('ws');

const Logger = require('../logger.js');

const RETRY_DELAY = 1500;
const MAX_RETRY_COUNT = 5;

function openWebSocket ({ url, authMessage, startPing, stopPing }) {

  return Bacon.fromBinder((sink) => {

    const ws = new WebSocket(url);

    ws.on('open', () => {
      Logger.debug('WebSocket opened successfully: ' + url);
      // TODO, we're investigating sending a success/error response from the server side through the WS
      ws.send(authMessage);
      startPing((p) => ws.send(p));
    });

    ws.on('message', (data) => sink(data));

    ws.on('close', () => {
      Logger.debug('WebSocket closed.');
      stopPing();
      sink(new Bacon.End());
    });

    ws.on('error', () => {
      Logger.debug('WebSocket error.');
      stopPing();
      sink(new Bacon.Error('WebSocket error.'));
    });

    return () => ws.close();
  });
}

function openWsStream ({ url, authMessage, startPing, stopPing }, remainingRetryCount = MAX_RETRY_COUNT) {

  const s_websocket = openWebSocket({ url, authMessage, startPing, stopPing });

  const s_interruption = s_websocket
    .filter(false)
    .mapEnd()
    .flatMapLatest(() => {
      if (remainingRetryCount === 0) {
        return new Bacon.Error(`WebSocket connection failed ${MAX_RETRY_COUNT} times!`);
      }
      const retryCount = (MAX_RETRY_COUNT - remainingRetryCount + 1);
      Logger.warn(`WebSocket connection closed, reconnecting... (${retryCount}/${MAX_RETRY_COUNT})`);
      return Bacon.later(RETRY_DELAY, null).flatMapLatest(() => {
        return openWsStream({ url, authMessage, startPing, stopPing }, remainingRetryCount - 1);
      });
    });

  return Bacon.mergeAll(s_websocket, s_interruption);
}

module.exports = {
  openWsStream,
};
