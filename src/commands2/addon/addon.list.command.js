import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const addonListCommand = defineCommand({
  description: 'List available add-ons',
  since: '0.2.3',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org: orgaIdOrName, format } = options;

    const ownerId = await Organisation.getId(orgaIdOrName);
    const addons = await Addon.list(ownerId);

    switch (format) {
      case 'json': {
        const formattedAddons = addons.map((addon) => {
          return {
            addonId: addon.id,
            creationDate: addon.creationDate,
            name: addon.name,
            planName: addon.plan.name,
            planSlug: addon.plan.slug,
            providerId: addon.provider.id,
            realId: addon.realId,
            region: addon.region,
            type: addon.provider.name,
          };
        });
        Logger.printJson(formattedAddons);
        break;
      }
      case 'human':
      default: {
        const formattedAddons = addons.map((addon) => {
          return [
            addon.plan.name + ' ' + addon.provider.name,
            addon.region,
            styleText(['bold', 'green'], addon.name),
            addon.id,
          ];
        });
        Logger.println(formatTable(formattedAddons));
      }
    }
  },
});
