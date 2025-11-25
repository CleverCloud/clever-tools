import { getDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { formatDrain } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  aliasOpt,
  appIdOrNameOpt,
  colorOpt,
  humanJsonOutputFormatOpt,
  updateNotifierOpt,
  verboseOpt,
} from '../global.opts.js';
import { drainIdArg } from './drain.args.js';

export const drainGetCommand = defineCommand({
  name: 'get',
  description: 'Get drain info',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [drainIdArg],
  async execute(params) {
    const [drainId] = params.args;
    const { alias, app: appIdOrName, format } = params.options;

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
