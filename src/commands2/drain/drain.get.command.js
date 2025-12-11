import { getDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { formatDrain } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainGetCommand = defineCommand({
  description: 'Get drain info',
  since: '0.9.0',
  sinceDate: '2017-08-18',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, app: appIdOrName, format } = options;

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
