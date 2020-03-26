'use strict';

const AppConfig = require('../models/app_configuration.js');
const application = require('@clevercloud/client/cjs/api/application.js');
const Logger = require('../logger.js');
const { sendToApi } = require('../models/send-to-api.js');

async function stop (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await application.undeploy({ id: ownerId, appId }).then(sendToApi);
  Logger.println('App successfully stopped!');
}

module.exports = { stop };
