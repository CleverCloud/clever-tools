'use strict';

const application = require('@clevercloud/client/cjs/api/v2/application.js');

const { sendToApi } = require('./send-to-api.js');

function list (ownerId, appId, showAll) {
  const limit = showAll ? null : 10;
  return application.getAllDeployments({ id: ownerId, appId, limit }).then(sendToApi);
};

module.exports = { list };
