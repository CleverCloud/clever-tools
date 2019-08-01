'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');

const { openWsStream } = require('./ws-stream.js');

const { getHostAndTokens } = require('./send-to-api.js');
const { prepareEventsWs } = require('@clevercloud/client/cjs/stream.node.js');

function getEvents (api, appId) {

  return Bacon
    .fromPromise(getHostAndTokens().then((params) => prepareEventsWs({ ...params, appId })))
    .flatMapLatest(openWsStream)
    .flatMapLatest(Bacon.try((rawEvent) => {
      const event = JSON.parse(rawEvent);
      const data = (event.data != null)
        ? JSON.parse(event.data)
        : null;
      return { ...event, data };
    }))
    .filter((event) => {
      return _.get(event, 'data.id   ') === appId
        || _.get(event, 'data.appId') === appId;
    });
};

module.exports = { getEvents };
