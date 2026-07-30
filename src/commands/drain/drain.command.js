import { ListLogDrainCommand } from '@clevercloud/client/cc-api-commands/log-drain/list-log-drain-command.js';
import { toLegacyLogDrain } from '../../legacy-json/log-drain.legacy.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { formatDrain, resolveDrainResource } from '../../models/drain.js';
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
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, appIdOrName, addonIdOrRealId, format } = options;
    const resource = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drains = await clients.ccApi.send(new ListLogDrainCommand(resource));

    switch (format) {
      case 'json': {
        // `--format json` still prints the raw v4 payloads, see src/legacy-json/README.md
        Logger.printJson(drains.map(toLegacyLogDrain));
        break;
      }
      case 'human':
      default: {
        if (drains.length === 0) {
          const resourceLabel = addonIdOrRealId ?? appIdOrName ?? resource.applicationId;
          Logger.println(`There are no drains for ${resourceLabel}`);
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
            Status: drain.status,
            'Execution status': drain.execution.status,
            URL: drain.target.url,
          };
        });

        console.table(formattedDrains);
      }
    }
  },
});
