'use strict';

const DRAIN_TYPES = [
  { id: 'TCPSyslog' },
  { id: 'UDPSyslog' },
  { id: 'HTTP', credentials: 'OPTIONAL' },
  { id: 'ElasticSearch', credentials: 'MANDATORY' },
  { id: 'DatadogHTTP' },
];

function createDrainBody (appId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig) {

  if (!authorizeDrainCreation(drainTargetType, drainTargetCredentials)) {
    throw new Error("Credentials are: optional for HTTP, mandatory for ElasticSearch and TCPSyslog/UDPSyslog don't need them.");
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
  return body;
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

module.exports = {
  createDrainBody,
  authorizeDrainCreation,
};
