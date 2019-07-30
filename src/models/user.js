'use strict';

const { get } = require('@clevercloud/client/cjs/api/organisation.js');
const { sendToApi } = require('../models/send-to-api.js');

function getCurrent (api) {
  return api.self.get().send();
};

function getCurrentId () {
  return get({}).then(sendToApi)
    .then(({ id }) => id);
};

module.exports = { getCurrent, getCurrentId };
