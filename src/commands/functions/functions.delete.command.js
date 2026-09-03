import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { deleteDeployment, deleteFunction, listDeployments } from '../../clever-client/functions.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameOption } from '../global.options.js';

export const functionsDeleteCommand = defineCommand({
  description: 'Delete a Clever Cloud Function and all its deployments',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Function ID',
      placeholder: 'function-id',
    }),
  ],
  async handler(options, functionId) {
    const { org } = options;
    const ownerId = await getOwnerIdFromOrgIdOrName(org);

    const deployments = await listDeployments({ ownerId, functionId }).then(sendToApi);
    for (const deployment of deployments) {
      await deleteDeployment({ ownerId, functionId, deploymentId: deployment.id }).then(sendToApi);
    }

    await deleteFunction({ ownerId, functionId }).then(sendToApi);
    Logger.printSuccess(`Function ${styleText('green', functionId)} and its ${deployments.length} deployment(s) deleted`);
  },
});
