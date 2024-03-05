'use strict';

const autocomplete = require('cliparse').autocomplete;

const DRAIN_TYPES = [
  { id: 'TCPSyslog' },
  { id: 'UDPSyslog' },
  { id: 'HTTP', credentials: 'OPTIONAL' },
  { id: 'ElasticSearch', credentials: 'MANDATORY', indexPrefix: 'OPTIONAL' },
  { id: 'DatadogHTTP' },
  { id: 'NewRelicHTTP', apiKey: 'MANDATORY' },
];

function createDrainBody (appId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig) {

  if (!authorizeDrainCreation(drainTargetType, drainTargetCredentials, drainTargetConfig)) {
    throw new Error("Credentials are: optional for HTTP, mandatory for ElasticSearch, NewRelicHTTP and TCPSyslog/UDPSyslog don't need them.");
  }

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
  if (keyExist(drainTargetConfig)) {
    body.APIKey = drainTargetConfig.apiKey;
  }
  if (indexPrefixExist(drainTargetConfig)) {
    body.indexPrefix = drainTargetConfig.indexPrefix;
  }
  return body;
}

function authorizeDrainCreation (drainTargetType, drainTargetCredentials, drainTargetConfig) {
  if (drainTypeExists(drainTargetType)) {
    // retrieve field for drain type ('mandatory', 'optional', undefined)
    const credStatus = fieldStatus(drainTargetType).credentials;
    const keyStatus = fieldStatus(drainTargetType).apiKey;
    const indexPrefixStatus = fieldStatus(drainTargetType).indexPrefix;

    if (credStatus === 'MANDATORY') {
      return credentialsExist(drainTargetCredentials);
    }
    if (credStatus === 'OPTIONAL') {
      return true;
    }
    if (!credStatus && !keyStatus) {
      return credentialsEmpty(drainTargetCredentials);
    }

    if (keyStatus === 'MANDATORY') {
      return keyExist(drainTargetConfig);
    }
    if (keyStatus === 'OPTIONAL') {
      return true;
    }
    if (!keyStatus) {
      return keyEmpty(drainTargetConfig);
    }

    if (indexPrefixStatus === 'MANDATORY') {
      return indexPrefixExist(drainTargetConfig);
    }
    if (indexPrefixStatus === 'OPTIONAL') {
      return true;
    }
    if (!indexPrefixStatus) {
      return indexPrefixEmpty(drainTargetConfig);
    }
  }
}

function fieldStatus (drainTargetType) {
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

function indexPrefixExist ({ indexPrefix }) {
  return indexPrefix != null;
}

function indexPrefixEmpty ({ indexPrefix }) {
  return indexPrefix == null;
}

function keyExist ({ apiKey }) {
  return apiKey != null;
}

function keyEmpty ({ apiKey }) {
  return apiKey == null;
}

function listDrainTypes () {
  return autocomplete.words(DRAIN_TYPES.map((type) => type.id));
}

module.exports = {
  createDrainBody,
  authorizeDrainCreation,
  listDrainTypes,
};
