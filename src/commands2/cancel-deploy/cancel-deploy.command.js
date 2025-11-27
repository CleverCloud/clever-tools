import { cancelDeployment, getAllDeployments } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const cancelDeployCommand = defineCommand({
  description: 'Cancel an ongoing deployment',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const deployments = await getAllDeployments({ id: ownerId, appId, limit: 1 }).then(sendToApi);

    if (deployments.length === 0 || deployments[0].action !== 'DEPLOY' || deployments[0].state !== 'WIP') {
      throw new Error('There is no ongoing deployment for this application');
    }

    await cancelDeployment({ id: ownerId, appId, deploymentId: deployments[0].id }).then(sendToApi);
    Logger.printSuccess(`Deployment ${styleText(['bold', 'green'], deployments[0].uuid)} successfully cancelled!`);
  },
});
