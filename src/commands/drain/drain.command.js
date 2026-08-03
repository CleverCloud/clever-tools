import { z } from 'zod';
import { getDrains } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { DRAIN_TYPE_CLI_CODES, DRAIN_TYPES, formatDrain, resolveDrainResource } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  addonIdOrRealIdOption,
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
} from '../global.options.js';

export const drainCommand = defineCommand({
  description: 'Manage drains',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    type: defineOption({
      name: 'type',
      schema: z.enum(DRAIN_TYPE_CLI_CODES).optional(),
      description: 'Only list drains of this type',
      placeholder: 'drain-type',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, appIdOrName, addonIdOrRealId, type, format } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const allDrains = await getDrains({ ownerId, resourceId }).then(sendToApi);

    // The resource scoped endpoint only filters on status, so the type filter is applied here.
    // The list is bounded by the number of drains of a single resource, it never paginates.
    const drainType = Object.values(DRAIN_TYPES).find((drainType) => drainType.cliCode === type);
    const drains = drainType == null ? allDrains : allDrains.filter((d) => d.recipient.type === drainType.apiCode);

    switch (format) {
      case 'json': {
        Logger.printJson(drains);
        break;
      }
      case 'human':
      default: {
        if (drains.length === 0) {
          const resourceLabel = addonIdOrRealId ?? appIdOrName ?? resourceId;
          const drainsLabel = drainType == null ? 'drains' : `${drainType.label} drains`;
          Logger.println(`There are no ${drainsLabel} for ${resourceLabel}`);
          return;
        }

        if (drains.length === 1) {
          const formattedDrain = formatDrain(drains[0]);
          console.table(formattedDrain);
          return;
        }

        const formattedDrains = drains.map((drain) => {
          return {
            ID: drain.id,
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
