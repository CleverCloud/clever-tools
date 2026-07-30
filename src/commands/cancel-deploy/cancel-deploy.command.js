import { CancelDeploymentCommand } from '@clevercloud/client/cc-api-commands/deployment/cancel-deployment-command.js';
import { ListDeploymentCommand } from '@clevercloud/client/cc-api-commands/deployment/list-deployment-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const cancelDeployCommand = defineCommand({
  description: 'Cancel an ongoing deployment',
  since: '0.2.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const deployments = await clients.ccApi.send(
      new ListDeploymentCommand({ ownerId, applicationId: appId, limit: 1 }),
    );

    if (deployments.length === 0 || deployments[0].action !== 'DEPLOY' || deployments[0].state !== 'WORK_IN_PROGRESS') {
      throw new Error('There is no ongoing deployment for this application');
    }

    // The v2 cancel endpoint expects the legacy numeric deployment id (exposed as `index` by the client transform)
    await clients.ccApi.send(
      new CancelDeploymentCommand({ ownerId, applicationId: appId, deploymentId: String(deployments[0].index) }),
    );
    Logger.printSuccess(`Deployment ${styleText(['bold', 'green'], deployments[0].id)} successfully cancelled!`);
  },
});
