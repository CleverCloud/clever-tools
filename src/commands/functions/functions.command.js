import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { listFunctions } from '../../clever-client/functions.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const functionsCommand = defineCommand({
  description: 'List Clever Cloud Functions',
  since: '4.9.0',
  isExperimental: true,
  featureFlag: 'functions',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, format } = options;
    const ownerId = await getOwnerIdFromOrgIdOrName(org);

    const functions = await listFunctions({ ownerId }).then(sendToApi);

    if (format === 'json') {
      Logger.printJson(functions);
      return;
    }

    if (functions.length === 0) {
      Logger.println(`ℹ️  No function found, create one with ${styleText('blue', 'clever functions create')}`);
      return;
    }

    console.table(
      functions.map((fn) => ({
        ID: fn.id,
        Name: fn.name ?? '',
        'Max instances': fn.maxInstances,
        'Max memory': fn.maxMemory,
        Created: fn.createdAt,
        Updated: fn.updatedAt,
      })),
    );
  },
});
