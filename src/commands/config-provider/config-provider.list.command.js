import { defineCommand } from '../../lib/define-command.js';
import { printGroupedList } from '../../lib/print-grouped-list.js';
import { styleText } from '../../lib/style-text.js';
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
    const providersPerOwner = Object.groupBy(deployed, (provider) => provider.ownerId);

    switch (format) {
      case 'json':
        Logger.printJson(providersPerOwner);
        break;
      case 'human':
      default:
        printGroupedList(deployed, {
          itemName: 'configuration provider',
          emptyCommand: 'clever addon create config-provider',
          groupBy: (p) => p.ownerId,
          getOwnerLabel: (p) => `${p.ownerId} (${p.ownerName})`,
          getItemLabel: (p) => `${p.name} ${styleText('grey', `(${p.realId})`)}`,
        });
        break;
    }
  },
});
