import { getAll } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const oauthConsumersListCommand = defineCommand({
  description: 'List OAuth consumers',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, format } = options;

    const id = org != null ? await Organisation.getId(org) : null;
    const consumers = await getAll({ id }).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(consumers);
        break;
      }
      case 'human':
      default: {
        if (consumers.length === 0) {
          Logger.println(
            `🔎 No OAuth consumer found, create one with ${styleText('blue', 'clever oauth-consumers create')} command`,
          );
          return;
        }

        Logger.println(`🔎 Found ${consumers.length} OAuth consumer${consumers.length > 1 ? 's' : ''}:`);
        Logger.println();

        consumers.forEach((c) => {
          Logger.println(`  • ${styleText('bold', c.name || '(unnamed)')} ${styleText('grey', `(${c.key})`)}`);
          if (c.url) {
            Logger.println(`    URL: ${c.url}`);
          }
        });
      }
    }
  },
});
