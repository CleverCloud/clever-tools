import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { formatTagsFilter, getTagsFromSummary, hasAllTags } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption, tagsFilterOption } from '../global.options.js';

export const addonListCommand = defineCommand({
  description: 'List available add-ons',
  since: '0.2.3',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    tags: { ...tagsFilterOption, featureFlag: 'tags' },
  },
  args: [],
  async handler(options) {
    const { org: orgaIdOrName, format, tags } = options;

    const ownerId = await Organisation.getId(orgaIdOrName);
    const allAddons = await Addon.list(ownerId);

    let addons = allAddons;
    if (tags != null) {
      const tagsPerAddonId = (await getTagsFromSummary()).addons;
      addons = allAddons.filter((addon) => hasAllTags(tagsPerAddonId.get(addon.id) ?? [], tags));
    }

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
        if (tags != null && addons.length === 0) {
          Logger.println(`🔎 No add-on found with the ${formatTagsFilter(tags)}`);
          break;
        }
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
