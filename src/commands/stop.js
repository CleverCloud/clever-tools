'use strict';

const Application = require('../models/application.js');
const application = require('@clevercloud/client/cjs/api/v2/application.js');
const Logger = require('../logger.js');
const { sendToApi } = require('../models/send-to-api.js');

async function stop (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await application.undeploy({ id: ownerId, appId }).then(sendToApi);
  Logger.println('App successfully stopped!');
}

module.exports = { stop };
