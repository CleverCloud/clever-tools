'use strict';

// const _ = require('lodash');
const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
// const autocomplete = require('cliparse').autocomplete;

// const AppConfiguration = require('./app_configuration.js');
// const Interact = require('./interact.js');
const Logger = require('../logger.js');
// const Organisation = require('./organisation.js');
// const User = require('./user.js');

const { sendToApi } = require('../models/send-to-api.js');

async function getNetworkgroups (ownerId, tags) {
  Logger.debug(`Get networkgroups for the ownerId: ${ownerId}`);
  const result = await networkgroup.get({ ownerId: ownerId, tags }).then(sendToApi);
  Logger.println(result);
};

module.exports = {
  getNetworkgroups,
};
