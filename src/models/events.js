'use strict';

const { getHostAndTokens } = require('./send-to-api.js');
const { EventsStream } = require('@clevercloud/client/cjs/streams/events.node.js');

async function getEventsStream (appId) {
  const { apiHost, tokens } = await getHostAndTokens();
  return new EventsStream({ apiHost, tokens, appId });
}

function openEventsStream (stream, onEvent, onError) {
  return stream.openResilientStream({
    onMessage: onEvent,
    onError,
    infinite: false,
    retryDelay: 2000,
    retryTimeout: 30000,
  });
};

module.exports = { getEventsStream, openEventsStream };
