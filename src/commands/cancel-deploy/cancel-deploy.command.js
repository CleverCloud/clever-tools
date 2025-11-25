import { cancelDeployment, getAllDeployments } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const cancelDeployCommand = defineCommand({
  name: 'cancel-deploy',
  description: 'Cancel an ongoing deployment',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const deployments = await getAllDeployments({ id: ownerId, appId, limit: 1 }).then(sendToApi);

    if (deployments.length === 0 || deployments[0].action !== 'DEPLOY' || deployments[0].state !== 'WIP') {
      throw new Error('There is no ongoing deployment for this application');
    }

    await cancelDeployment({ id: ownerId, appId, deploymentId: deployments[0].id }).then(sendToApi);
    Logger.printSuccess(`Deployment ${styleText(['bold', 'green'], deployments[0].uuid)} successfully cancelled!`);
  },
});
