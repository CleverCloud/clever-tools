'use strict';

const https = require('https');

const _ = require('lodash');
const Bacon = require('baconjs');
const request = require('request');
const autocomplete = require('cliparse').autocomplete;

const Logger = require('../logger.js');
const { conf } = require('./configuration.js');

const DRAIN_TYPES = [
  { id: 'TCPSyslog' },
  { id: 'UDPSyslog' },
  { id: 'HTTP', credentials: 'OPTIONAL' },
  { id: 'ElasticSearch', credentials: 'MANDATORY' },
  { id: 'Datadog', datadogAPIKey: 'MANDATORY' },
];

const makeJsonRequest = function (api, verb, url, queryParams, body) {
  const completeUrl = conf.API_HOST + url;
  Logger.debug(`${verb} ${completeUrl}`);
  const options = {
    method: verb,
    url: completeUrl,
    headers: {
      Authorization: api.session.getAuthorization(verb, completeUrl, queryParams),
      Accept: 'application/json',
    },
  };
  if (completeUrl.startsWith('https://')) {
    options.agent = new https.Agent({ keepAlive: true });
  }

  if (body) {
    options.json = body;
  }

  return Bacon.fromNodeCallback(request, options)
    .flatMapLatest((res) => {
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
      if (!_.isError(jsonBody) && jsonBody.type === 'error') {
        return new Bacon.Error(jsonBody);
      }
    });
};

function list (api, appId) {
  Logger.debug(`Fetching drains for ${appId}`);
  return makeJsonRequest(api, 'GET', `/logs/${appId}/drains`, {});
}

function create (api, appId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig) {
  Logger.debug(`Registering drain for ${appId}`);

  if (authorizeDrainCreation(drainTargetType, drainTargetCredentials)) {
    const body = {
      url: drainTargetURL,
      drainType: drainTargetType,
    };
    if (credentialsExist(drainTargetCredentials)) {
      body.credentials = {
        username: drainTargetCredentials.username || '',
        password: drainTargetCredentials.password || '',
      };
    }
    if (drainTargetType === 'Datadog') {
      if (drainTargetConfig.apiKey == null) {
        return Bacon.once(new Bacon.Error(`APIKey is mandatory on for this drain type.`));
      }
      body.APIKey = drainTargetConfig.apiKey;
    }
    return makeJsonRequest(api, 'POST', `/logs/${appId}/drains`, {}, body);
  }

  return Bacon.once(new Bacon.Error(`Credentials are: optional for HTTP, mandatory for ElasticSearch and TCPSyslog/UDPSyslog don't need them.`));
}

function remove (api, appId, drainId) {
  Logger.debug(`Removing drain ${drainId} for ${appId}`);
  return makeJsonRequest(api, 'DELETE', `/logs/${appId}/drains/${drainId}`, {});
}

function enable (api, appId, drainId) {
  Logger.debug(`Enable drain ${drainId} for ${appId}`);
  return makeJsonRequest(api, 'PUT', `/logs/${appId}/drains/${drainId}/state`, {}, { state: 'ENABLED' });
}

function disable (api, appId, drainId) {
  Logger.debug(`Disable drain ${drainId} for ${appId}`);
  return makeJsonRequest(api, 'PUT', `/logs/${appId}/drains/${drainId}/state`, {}, { state: 'DISABLED' });
}

function authorizeDrainCreation (drainTargetType, drainTargetCredentials) {
  if (drainTypeExists(drainTargetType)) {
    // retrieve creds for drain type ('mandatory', 'optional', undefined)
    const status = credentialsStatus(drainTargetType).credentials;
    if (status === 'MANDATORY') {
      return credentialsExist(drainTargetCredentials);
    }
    if (status === 'OPTIONAL') {
      return true;
    }
    return credentialsEmpty(drainTargetCredentials);
  }
}

function credentialsStatus (drainTargetType) {
  return DRAIN_TYPES.find(({ id }) => id === drainTargetType);
}

function drainTypeExists (drainTargetType) {
  return DRAIN_TYPES.some(({ id }) => id === drainTargetType);
}

function credentialsExist ({ username, password }) {
  return username != null && password != null;
}

function credentialsEmpty ({ username, password }) {
  return username == null && password == null;
}

function listDrainTypes () {
  return autocomplete.words(DRAIN_TYPES.map((type) => type.id));
}

module.exports = {
  list,
  create,
  remove,
  enable,
  disable,
  authorizeDrainCreation,
  listDrainTypes,
};
