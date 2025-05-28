import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import { getAllDeployments, cancelDeployment } from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';
import colors from 'colors/safe.js';

export async function cancelDeploy (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const deployments = await getAllDeployments({ id: ownerId, appId, limit: 1 }).then(sendToApi);

  if (deployments.length === 0 || (deployments[0].action !== 'DEPLOY' || deployments[0].state !== 'WIP')) {
    throw new Error('There is no ongoing deployment for this application');
  }

  await cancelDeployment({ id: ownerId, appId, deploymentId: deployments[0].id }).then(sendToApi);
  Logger.printSuccess(`Deployment ${colors.bold.green(deployments[0].uuid)} successfully cancelled!`);
};
