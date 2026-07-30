import { GetLogDrainCommand } from '@clevercloud/client/cc-api-commands/log-drain/get-log-drain-command.js';
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
import { drainIdArg } from './drain.args.js';

export const drainGetCommand = defineCommand({
  description: 'Get drain info',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    format: humanJsonOutputFormatOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, appIdOrName, addonIdOrRealId, format } = options;
    const resource = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await clients.ccApi.send(new GetLogDrainCommand({ ...resource, drainId }));

    switch (format) {
      case 'json': {
        // `--format json` still prints the raw v4 payload, see src/legacy-json/README.md
        Logger.printJson(toLegacyLogDrain(drain));
        break;
      }
      case 'human':
      default: {
        const formattedDrain = formatDrain(drain);
        console.table(formattedDrain);
      }
    }
  },
});
