import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { filterDrainsByType, formatDrainsTable, getAllDrains } from '../../models/drain.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { drainTypeFilterOption } from './drain.options.js';

export const drainListCommand = defineCommand({
  description: 'List the drains of all applications and add-ons',
  since: '5.3.0',
  options: {
    org: orgaIdOrNameOption,
    drainType: drainTypeFilterOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { drainType, format } = options;

    // An empty `--org` value is the same as no organisation at all, as in `clever applications list`
    const orgaIdOrName = options.org?.orga_name !== '' ? options.org : null;

    const allOwners = await getAllDrains(orgaIdOrName);
    const owners = allOwners.map((owner) => ({ ...owner, drains: filterDrainsByType(owner.drains, drainType) }));
    const failedOwners = owners.filter((owner) => owner.error != null);

    // Listing nothing at all is an error, not an empty result
    if (owners.length > 0 && failedOwners.length === owners.length) {
      throw failedOwners[0].error;
    }

    for (const owner of failedOwners) {
      Logger.printErrorLine(
        styleText('yellow', `Cannot list the drains of '${owner.name}' (${owner.id}): ${owner.error.message}`),
      );
    }

    switch (format) {
      case 'json': {
        // Same shape as `clever drain`: a flat list of drains, each one knowing its owner
        Logger.printJson(
          owners.flatMap((owner) =>
            owner.drains.map((drain) => ({ ...drain, ownerId: owner.id, ownerName: owner.name })),
          ),
        );
        break;
      }
      case 'human':
      default: {
        const ownersWithDrains = owners.filter((owner) => owner.drains.length > 0);

        if (ownersWithDrains.length === 0) {
          let ownerLabel = owners.length === 1 ? owners[0].name : 'your organisations';
          // The organisations that could not be listed may have drains, only conclude on the others
          if (failedOwners.length > 0) {
            ownerLabel = 'the organisations that could be listed';
          }
          const drainsLabel = drainType == null ? 'drains' : `${drainType.label} drains`;
          Logger.println(`There are no ${drainsLabel} for ${ownerLabel}`);
          return;
        }

        for (const owner of ownersWithDrains) {
          const drainsPlural = owner.drains.length !== 1 ? 'drains' : 'drain';

          Logger.println();
          Logger.println(
            styleText(
              'blue',
              `• Organisation '${owner.name}' (${owner.id}) with ${owner.drains.length} ${drainsPlural}:`,
            ),
          );

          Logger.println();
          // A tenant-scoped drain (audit logs) has no resource, it belongs to the organisation itself
          Logger.println(
            formatDrainsTable(owner.drains, (drain) => drain.resourceName ?? drain.resourceId ?? owner.name),
          );
        }
      }
    }
  },
});
