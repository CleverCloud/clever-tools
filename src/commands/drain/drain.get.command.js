import { getDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { formatDrain, resolveDrainResource } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
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
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

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
