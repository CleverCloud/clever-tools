import { defineCommand } from '../../lib/define-command.js';
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
        if (deployed.length === 0) {
          Logger.println(
            `No configuration provider found, create one with ${styleText('blue', 'clever addon create config-provider')} command`,
          );
          return;
        }

        Logger.println(`Found ${deployed.length} configuration provider${deployed.length > 1 ? 's' : ''}:`);
        Logger.println();

        Object.values(providersPerOwner).forEach((providers) => {
          Logger.println(`${styleText('bold', `${providers[0].ownerId} (${providers[0].ownerName})`)}`);
          providers.forEach((provider) => {
            Logger.println(`  ${provider.name} ${styleText('grey', `(${provider.realId})`)}`);
          });
          Logger.println();
        });
        break;
    }
  },
});
