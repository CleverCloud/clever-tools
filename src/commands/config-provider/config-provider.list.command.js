import { defineCommand } from '../../lib/define-command.js';
import { printItemsByOwner } from '../../lib/print-items-by-owner.js';
import { Logger } from '../../logger.js';
import { findAddonsByAddonProvider } from '../../models/ids-resolver.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const configProviderListCommand = defineCommand({
  description: 'List configuration providers',
  since: '4.6.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;
    const deployed = await findAddonsByAddonProvider('config-provider');

    switch (format) {
      case 'json': {
        const providersPerOwner = Object.groupBy(deployed, (p) => p.ownerId);
        Logger.printJson(providersPerOwner);
        break;
      }
      case 'human':
      default:
        printItemsByOwner(deployed, {
          itemName: 'configuration provider',
          emptyCommand: 'clever addon create config-provider',
          getItemId: (p) => p.realId,
        });
        break;
    }
  },
});
