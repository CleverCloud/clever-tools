'use strict';

const { get } = require('@clevercloud/client/cjs/api/v2/organisation.js');
const { addEmailAddress, getEmailAddresses, getSshKeys, removeEmailAddress } = require('@clevercloud/client/cjs/api/v2/user.js');
const { sendToApi } = require('../models/send-to-api.js');

function getCurrent () {
  return get({}).then(sendToApi);
};

function getCurrentId () {
  return get({}).then(sendToApi)
    .then(({ id }) => id);
};

function getEmails () {
  return getEmailAddresses({}).then(sendToApi)
}

function addEmail (email) {
  return addEmailAddress({ email }).then(sendToApi);
}

function removeEmail (email) {
  return removeEmailAddress({}, { email }).then(sendToApi);
}

function addPrimaryEmail (email) {
  return addEmailAddress({ email }, { 'make_primary': true }).then(sendToApi);
}

function getKeys () {
  return getSshKeys({}).then(sendToApi);
}

module.exports = { addEmail, addPrimaryEmail, getCurrent, getCurrentId, getEmails, getKeys, removeEmail };
