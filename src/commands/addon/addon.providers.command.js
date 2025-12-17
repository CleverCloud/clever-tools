import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const addonProvidersCommand = defineCommand({
  description: 'List available add-on providers',
  since: '0.2.3',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

    const providers = await Addon.listProviders();

    switch (format) {
      case 'json': {
        const formattedProviders = providers.map((provider) => ({
          id: provider.id,
          name: provider.name,
          shortDesc: provider.shortDesc,
          regions: provider.regions,
          plans: provider.plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
          })),
        }));
        Logger.printJson(formattedProviders);
        break;
      }
      case 'human':
      default: {
        const formattedProviders = providers.map((provider) => {
          return [styleText('bold', provider.id), provider.name, provider.shortDesc || ''];
        });
        Logger.println(formatTable(formattedProviders));
      }
    }
  },
});
