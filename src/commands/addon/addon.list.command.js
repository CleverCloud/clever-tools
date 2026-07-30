import { formatTable } from '../../format-table.js';
import { toEpochMs } from '../../legacy-json/legacy-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
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

    const ownerId = await getOwnerIdFromOrgIdOrName(orgaIdOrName);
    const addons = await Addon.list(ownerId);

    switch (format) {
      case 'json': {
        // `--format json` still prints the creation date as epoch milliseconds, see src/legacy-json/README.md
        const formattedAddons = addons.map((addon) => {
          return {
            addonId: addon.id,
            creationDate: toEpochMs(addon.createdAt),
            name: addon.name,
            planName: addon.plan.name,
            planSlug: addon.plan.slug,
            providerId: addon.provider.id,
            realId: addon.realId,
            region: addon.zone,
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
            addon.zone,
            styleText(['bold', 'green'], addon.name),
            addon.id,
          ];
        });
        Logger.println(formatTable(formattedAddons));
      }
    }
  },
});
