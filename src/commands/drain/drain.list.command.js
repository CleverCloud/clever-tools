import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { formatDrainRow, getAllDrains } from '../../models/drain.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const drainListCommand = defineCommand({
  description: 'List the drains of all applications and add-ons',
  since: null,
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

    // An empty `--org` value is the same as no organisation at all, as in `clever applications list`
    const orgaIdOrName = options.org?.orga_name !== '' ? options.org : null;

    const owners = await getAllDrains(orgaIdOrName);
    const failedOwners = owners.filter((owner) => owner.error != null);

    // Listing nothing at all is an error, not an empty result
    if (owners.length > 0 && failedOwners.length === owners.length) {
      throw failedOwners[0].error;
    }

    failedOwners.forEach((owner) => {
      Logger.printErrorLine(
        styleText('yellow', `Cannot list the drains of '${owner.name}' (${owner.id}): ${owner.error.message}`),
      );
    });

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
          const ownerLabel = owners.length === 1 ? owners[0].name : 'your organisations';
          Logger.println(`There are no drains for ${ownerLabel}`);
          return;
        }

        ownersWithDrains.forEach((owner) => {
          const drainsPlural = owner.drains.length !== 1 ? 'drains' : 'drain';

          Logger.println();
          Logger.println(
            styleText(
              'blue',
              `• Organisation '${owner.name}' (${owner.id}) with ${owner.drains.length} ${drainsPlural}:`,
            ),
          );

          // A tenant-scoped drain (audit logs) has no resource, it belongs to the organisation itself
          console.table(
            owner.drains.map((drain) => formatDrainRow(drain, drain.resourceName ?? drain.resourceId ?? owner.name)),
          );
        });
      }
    }
  },
});
