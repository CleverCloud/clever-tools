import { getDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { formatDrain } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag, humanJsonOutputFormatFlag } from '../global.flags.js';
import { drainIdArg } from './drain.args.js';

export const drainGetCommand = defineCommand({
  description: 'Get drain info',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [drainIdArg],
  async handler(flags, drainId) {
    const { alias, app: appIdOrName, format } = flags;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    const drain = await getDrain({ ownerId, applicationId, drainId }).then(sendToApi);

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
