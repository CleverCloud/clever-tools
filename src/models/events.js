'use strict';

const Bacon = require('baconjs');

const { getHostAndTokens } = require('./send-to-api.js');
const { EventsStream } = require('@clevercloud/client/cjs/streams/events.node.js');

function getEvents (appId) {
  return Bacon
    .fromPromise(getHostAndTokens())
    .flatMapLatest(({ apiHost, tokens }) => {
      return Bacon.fromBinder((sink) => {
        const eventsStream = new EventsStream({ apiHost, tokens, appId });
        return eventsStream.openResilientStream({
          onMessage: sink,
          onError: (error) => sink(new Bacon.Error(error)),
          infinite: false,
          retryDelay: 2000,
          retryTimeout: 30000,
        });
      });
    });
};

module.exports = { getEvents };
