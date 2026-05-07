import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { listDeployments } from '../../clever-client/functions.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const functionsDeploymentsCommand = defineCommand({
  description: 'List deployments of a Clever Cloud Function',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Function ID',
      placeholder: 'function-id',
    }),
  ],
  async handler(options, functionId) {
    const { org, format } = options;
    const ownerId = await getOwnerIdFromOrgIdOrName(org);

    const deployments = await listDeployments({ ownerId, functionId }).then(sendToApi);

    if (format === 'json') {
      Logger.printJson(deployments);
      return;
    }

    if (deployments.length === 0) {
      Logger.println(`ℹ️  No deployment found for function ${styleText('blue', functionId)}`);
      return;
    }

    console.table(
      deployments.map((d) => ({
        ID: d.id,
        Status: d.status,
        Platform: d.platform,
        URL: d.url ?? '',
        Created: d.createdAt,
      })),
    );
  },
});
