'use strict';

const _ = require('lodash');
const autocomplete = require('cliparse').autocomplete;
const Bacon = require('baconjs');
const https = require('https');
const request = require('request');

const Logger = require('../logger.js');
const { conf } = require('./configuration.js');

const makeJsonRequest = function (api, verb, url, queryParams, body) {
  const completeUrl = conf.API_HOST + url;
  Logger.debug(`${verb} ${completeUrl}`);
  const options = {
    method: verb,
    url: completeUrl,
    headers: {
      authorization: api.session.getAuthorization(verb, completeUrl, queryParams),
      'Accept': 'application/json',
    },
  };
  if (completeUrl.startsWith('https://')) {
    options.agent = new https.Agent({ keepAlive: true });
  }

  if (body) {
    options.json = body;
  }
  const s_res = Bacon.fromNodeCallback(request, options);

  return s_res.flatMapLatest(function (res) {
    if (res.statusCode >= 400) {
      return new Bacon.Error(res.body);
    }
    if (typeof res.body === 'object') {
      return res.body;
    }

    const jsonBody = _.attempt(JSON.parse, res.body);
    if (!_.isError(jsonBody) && _.isArray(jsonBody)) {
      return jsonBody;
    }
    if (!_.isError(jsonBody) && jsonBody['type'] === 'error') {
      return new Bacon.Error(jsonBody);
    }
    return new Bacon.Error(`Received invalid JSON: ${res.body}`);
  });
};

function list (api, type, owner_id, entity_id) {
  type = type === 'emailhooks' ? type : 'webhooks';
  Logger.debug(`Fetching notifications for ${owner_id}`);
  return makeJsonRequest(api, 'GET', `/notifications/${type}/${owner_id}`, {})
    .flatMapLatest((hooks) => {
      return hooks.filter((hook) => {
        const emptyScope = !hook.scope || hook.scope.length === 0;
        return !entity_id || emptyScope || hook.scope.includes(entity_id);
      });
    });
}

function add (api, type, owner_id, name, targets, scope, events) {
  type = type === 'emailhooks' ? type : 'webhooks';
  Logger.debug(`Registering notification for ${owner_id}`);

  let body = {};
  if (type === 'emailhooks') {
    body = { name, notified: targets };
  }
  else if (type === 'webhooks') {
    body = { name, urls: targets };
  }

  if (scope) {
    body.scope = scope;
  }
  if (events) {
    body.events = events;
  }

  return makeJsonRequest(api, 'POST', `/notifications/${type}/${owner_id}`, {}, body);
}

function remove (api, type, owner_id, notif_id) {
  type = type === 'emailhooks' ? type : 'webhooks';
  Logger.debug(`Removing notification ${notif_id} for ${owner_id}`);

  return makeJsonRequest(api, 'DELETE', `/notifications/${type}/${owner_id}/${notif_id}`, {})
    .flatMapError((error) => {
      if (error === 'Received invalid JSON: ') {
        return null;
      }
      return new Bacon.Error(error);
    });
}

function listMetaEvents () {
  return autocomplete.words([
    'META_SERVICE_LIFECYCLE',
    'META_DEPLOYMENT_RESULT',
    'META_SERVICE_MANAGEMENT',
    'META_CREDITS',
  ]);
}

module.exports = {
  list,
  add,
  remove,
  listMetaEvents,
};
