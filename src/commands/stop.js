'use strict';

const Application = require('../models/application.js');
const application = require('@clevercloud/client/cjs/api/v2/application.js');
const Logger = require('../logger.js');
const { sendToApi } = require('../models/send-to-api.js');
const { getAllDeployments, cancelDeployment } = require('@clevercloud/client/cjs/api/v2/application.js');

async function stop (params) {
  const { alias, app: appIdOrName, all } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await application.undeploy({ id: ownerId, appId }).then(sendToApi);
  Logger.println('App successfully stopped!');

  if (all) {
    const deployments = await getAllDeployments({ id: ownerId, appId, limit: 1 }).then(sendToApi);
    if (deployments.length !== 0 && deployments[0].state === 'WIP') {
      const deploymentId = deployments[0].id;
      await cancelDeployment({ id: ownerId, appId, deploymentId }).then(sendToApi);
      Logger.println(`Deployment ${deploymentId} cancelled!`);
    }

  }
}

module.exports = { stop };
