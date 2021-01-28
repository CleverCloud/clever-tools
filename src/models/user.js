'use strict';

const { get } = require('@clevercloud/client/cjs/api/v2/organisation.js');
const { sendToApi } = require('../models/send-to-api.js');

function getCurrent () {
  return get({}).then(sendToApi);
};

function getCurrentId () {
  return get({}).then(sendToApi)
    .then(({ id }) => id);
};

module.exports = { getCurrent, getCurrentId };
