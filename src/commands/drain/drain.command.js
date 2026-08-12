import { getDrains } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import { formatDrain, formatDrainRow, getAllDrains, resolveDrainResource } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  addonIdOrRealIdOption,
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
  orgaIdOrNameOption,
} from '../global.options.js';

export const drainCommand = defineCommand({
  description: 'Manage drains',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, appIdOrName, addonIdOrRealId, format } = options;

    // An empty `--org` value is the same as no organisation at all, as in `clever applications list`
    const orgaIdOrName = options.org?.orga_name !== '' ? options.org : null;
    const hasTargetedResource = alias != null || appIdOrName != null || addonIdOrRealId != null;

    if (orgaIdOrName != null && hasTargetedResource) {
      throw new Error('`--org` cannot be combined with `--app`, `--alias` or `--addon`');
    }

    // Without a targeted resource and without a linked application, we list the drains of every resource
    // of the targeted organisation, or of all the organisations the user belongs to
    if (!hasTargetedResource) {
      const appConfig = await AppConfig.loadApplicationConf();

      if (orgaIdOrName != null || appConfig.apps.length === 0) {
        printOwnersDrains(await getAllDrains(orgaIdOrName), format);
        return;
      }

      // The linked application can come from a parent directory, so we name the one we resolved
      const { appId, ownerId, name } = await AppConfig.getAppDetails({ appConfig });
      if (format === 'human') {
        Logger.printInfo(`Drains of the linked application '${name}' (${appId})`);
      }
      await printResourceDrains(ownerId, appId, name, format);
      return;
    }

    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);
    const resourceLabel = addonIdOrRealId ?? appIdOrName?.app_id ?? appIdOrName?.app_name ?? resourceId;
    await printResourceDrains(ownerId, resourceId, resourceLabel, format);
  },
});

/**
 * @param {String} ownerId
 * @param {String} resourceId
 * @param {String} resourceLabel
 * @param {'human'|'json'} format
 */
async function printResourceDrains(ownerId, resourceId, resourceLabel, format) {
  const drains = await getDrains({ ownerId, resourceId }).then(sendToApi);

  switch (format) {
    case 'json': {
      Logger.printJson(drains);
      break;
    }
    case 'human':
    default: {
      if (drains.length === 0) {
        Logger.println(`There are no drains for ${resourceLabel}`);
        return;
      }

      if (drains.length === 1) {
        console.table(formatDrain(drains[0]));
        return;
      }

      console.table(drains.map((drain) => formatDrainRow(drain)));
    }
  }
}

/**
 * @param {Array<{ id: String, name: String, drains: Array<Object>, error: Error|null }>} owners
 * @param {'human'|'json'} format
 */
function printOwnersDrains(owners, format) {
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
      // Same shape as when a resource is targeted: a flat list of drains, each one knowing its owner
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
}
