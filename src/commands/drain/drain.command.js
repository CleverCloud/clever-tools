import { z } from 'zod';
import { getDrains } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { DRAIN_TYPES, filterDrainsByType, formatDrain, resolveDrainResource } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  addonIdOrRealIdOption,
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
} from '../global.options.js';

const DRAIN_TYPE_CLI_CODES = Object.values(DRAIN_TYPES).map(({ cliCode }) => cliCode);

export const drainCommand = defineCommand({
  description: 'Manage drains',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    drainType: defineOption({
      name: 'type',
      schema: z
        .enum(DRAIN_TYPE_CLI_CODES)
        .transform((cliCode) => Object.values(DRAIN_TYPES).find((drainType) => drainType.cliCode === cliCode))
        .optional(),
      description: 'Only list drains of this type',
      placeholder: 'drain-type',
    }),
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

        const formattedDrains = drains.map((drain) => {
          return {
            ID: drain.id,
            Kind: drain.kind,
            Type: DRAIN_TYPES[drain.recipient.type]?.label ?? drain.recipient.type,
            Status: drain.status.status,
            'Execution status': drain.execution.status,
            URL: drain.recipient.url,
          };
        });

        console.table(formattedDrains);
      }
    }
  },
});
