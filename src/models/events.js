'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');

const { conf } = require('./configuration.js');
const WsStream = require('./ws-stream.js');

function getEvents (api, appId) {
  const url = conf.EVENT_URL;

  return WsStream.openStream(() => url, api.session.getAuthorization('GET', `${conf.API_HOST}/events/`, {}))
    .flatMapLatest(Bacon.try((event) => {
      const data = JSON.parse(event.data);
      return { ...event, data };
    }))
    .skipErrors()
    .filter((event) => {
      return _.get(event, 'data.id   ') === appId
        || _.get(event, 'data.appId') === appId;
    });
};

module.exports = { getEvents };
