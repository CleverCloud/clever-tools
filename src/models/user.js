'use strict';

const { get } = require('@clevercloud/client/cjs/api/v2/organisation.js');
const { addEmailAddress, getEmailAddresses, getSshKeys, addSshKey, removeSshKey, removeEmailAddress } = require('@clevercloud/client/cjs/api/v2/user.js');
const { sendToApi } = require('../models/send-to-api.js');

function getCurrent () {
  return get({}).then(sendToApi);
};

function getCurrentId () {
  return get({}).then(sendToApi)
    .then(({ id }) => id);
};

function getEmails () {
  return getEmailAddresses({}).then(sendToApi);
}

function addEmail (email) {
  const encoded = encodeURIComponent(email);
  return addEmailAddress({ email: encoded }).then(sendToApi);
}

function removeEmail (email) {
  const encoded = encodeURIComponent(email);
  return removeEmailAddress({ email: encoded }).then(sendToApi);
}

function addPrimaryEmail (email) {
  const encoded = encodeURIComponent(email);
  return addEmailAddress({ email: encoded }, { make_primary: true }).then(sendToApi);
}

function getKeys () {
  return getSshKeys({}).then(sendToApi);
}

function addKey (key, body) {
  const encoded = encodeURIComponent(key);
  return addSshKey({ key: encoded }, `"${body}"`).then(sendToApi);
}

function removeKey (key) {
  const encoded = encodeURIComponent(key);
  return removeSshKey({ key: encoded }).then(sendToApi);
}

module.exports = { addEmail, addPrimaryEmail, addKey, getCurrent, getCurrentId, getEmails, getKeys, removeEmail, removeKey };
