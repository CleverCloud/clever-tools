import { getDrains } from '../../clever-client/drains.js';
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

export const drainCommand = {
  name: 'drain',
  description: 'Manage drains',
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
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, format } = params.options;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    const drains = await getDrains({ ownerId, applicationId }).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(drains);
        break;
      }
      case 'human':
      default: {
        if (drains.length === 0) {
          Logger.println(`There are no drains for ${applicationId}`);
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
};
