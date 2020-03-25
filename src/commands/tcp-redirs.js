'use strict';

const AppConfig = require('../models/app_configuration.js');
const { sendToApi } = require('../models/send-to-api.js');
const Logger = require('../logger.js');
const organisation = require('@clevercloud/client/cjs/api/organisation.js');

async function listNamespaces (params) {
  const { alias } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const namespaces = await organisation.getNamespaces({ id: ownerId }).then(sendToApi);

  Logger.println('Available namespaces: ' + namespaces.map(({ namespace }) => namespace).join(', '));
};

module.exports = { listNamespaces };
