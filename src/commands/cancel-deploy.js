'use strict';

const Application = require('../models/application.js');
const Logger = require('../logger.js');
const { getAllDeployments, cancelDeployment } = require('@clevercloud/client/cjs/api/v2/application.js');
const { sendToApi } = require('../models/send-to-api.js');

async function cancelDeploy (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const deployments = await getAllDeployments({ id: ownerId, appId, limit: 1 }).then(sendToApi);

  if (deployments.length === 0 || (deployments[0].action !== 'DEPLOY' || deployments[0].state !== 'WIP')) {
    throw new Error('There is no ongoing deployment for this application');
  }

  const deploymentId = deployments[0].id;
  await cancelDeployment({ id: ownerId, appId, deploymentId }).then(sendToApi);

  Logger.println('Deployment cancelled!');
};

module.exports = { cancelDeploy };
