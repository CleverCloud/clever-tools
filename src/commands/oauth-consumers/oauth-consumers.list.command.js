import { defineCommand } from '../../lib/define-command.js';
import { printItemsByOwner } from '../../lib/print-items-by-owner.js';
import { Logger } from '../../logger.js';
import { getAllConsumers } from '../../models/oauth-consumer.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const oauthConsumersListCommand = defineCommand({
  description: 'List OAuth consumers',
  since: 'unreleased',
  options: {
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    const { format } = options;
    const oauthConsumers = await getAllConsumers();

    switch (format) {
      case 'json': {
        const consumersPerOwner = Object.groupBy(oauthConsumers, (c) => c.ownerId);
        Logger.printJson(consumersPerOwner);
        break;
      }
      case 'human':
      default: {
        printItemsByOwner(oauthConsumers, {
          itemName: 'OAuth consumer',
          emptyCommand: 'clever oauth-consumers create',
          getItemId: (c) => c.key,
          getExtraLines: (c) => (c.url ? `URL: ${c.url}` : null),
        });
      }
    }
  },
});
