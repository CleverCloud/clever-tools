import { defineCommand } from '../../lib/define-command.js';
import { printGroupedList } from '../../lib/print-grouped-list.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getAllConsumers } from '../../models/oauth-consumer.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const oauthConsumersListCommand = defineCommand({
  description: 'List OAuth consumers',
  since: '4.8.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;
    const consumers = await getAllConsumers();

    switch (format) {
      case 'json': {
        const consumersPerOwner = Object.groupBy(consumers, (c) => c.ownerId);
        Logger.printJson(consumersPerOwner);
        break;
      }
      case 'human':
      default: {
        printGroupedList(consumers, {
          itemName: 'OAuth consumer',
          emptyCommand: 'clever oauth-consumers create',
          groupBy: (c) => c.ownerId,
          getOwnerLabel: (c) => `${c.ownerId} (${c.ownerName})`,
          getItemLabel: (c) => `${c.name || '(unnamed)'} ${styleText('grey', `(${c.key})`)}`,
          getItemDetails: (c) => (c.url ? `URL: ${c.url}` : null),
        });
      }
    }
  },
});
