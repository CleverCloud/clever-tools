import { getDrains } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { filterDrainsByType, formatDrain, formatDrainsTable, resolveDrainResource } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  addonIdOrRealIdOption,
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
} from '../global.options.js';
import { drainTypeFilterOption } from './drain.options.js';

export const drainCommand = defineCommand({
  description: 'Manage drains',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    drainType: drainTypeFilterOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, appIdOrName, addonIdOrRealId, drainType, format } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const allDrains = await getDrains({ ownerId, resourceId }).then(sendToApi);

    // The resource scoped endpoint only filters on status, so the type filter is applied here.
    // The list is bounded by the number of drains of a single resource, it never paginates.
    const drains = filterDrainsByType(allDrains, drainType);

    switch (format) {
      case 'json': {
        Logger.printJson(drains);
        break;
      }
      case 'human':
      default: {
        if (drains.length === 0) {
          const resourceLabel = addonIdOrRealId ?? appIdOrName?.app_id ?? appIdOrName?.app_name ?? alias ?? resourceId;
          const drainsLabel = drainType == null ? 'drains' : `${drainType.label} drains`;
          Logger.println(`There are no ${drainsLabel} for ${resourceLabel}`);
          return;
        }

        // A filtered list keeps the table layout whatever the number of matches
        if (drains.length === 1 && drainType == null) {
          const formattedDrain = formatDrain(drains[0]);
          console.table(formattedDrain);
          return;
        }

        Logger.println(formatDrainsTable(drains));
      }
    }
  },
});
