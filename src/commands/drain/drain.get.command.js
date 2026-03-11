import { getDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { formatDrain } from '../../models/drain.js';
import { resolveDrainResourceFromOptions } from '../../models/drain.resource-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
  resourceIdOrNameOption,
} from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainGetCommand = defineCommand({
  description: 'Get drain info',
  since: '0.9.0',
  options: {
    resource: resourceIdOrNameOption,
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { resource: resourceIdOrName, alias, app: appIdOrName, format } = options;

    const { ownerId, resourceId } = await resolveDrainResourceFromOptions(resourceIdOrName, appIdOrName, alias);

    const drain = await getDrain({ ownerId, resourceId, drainId }).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(drain);
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
