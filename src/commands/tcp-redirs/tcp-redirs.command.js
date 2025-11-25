import { getTcpRedirs } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  aliasOpt,
  appIdOrNameOpt,
  colorOpt,
  humanJsonOutputFormatOpt,
  updateNotifierOpt,
  verboseOpt,
} from '../global.opts.js';

export const tcpRedirsCommand = defineCommand({
  name: 'tcp-redirs',
  description: 'Control the TCP redirections from reverse proxies to your application',
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
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const redirs = await getTcpRedirs({ id: ownerId, appId }).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(redirs);
        break;
      }
      case 'human':
      default: {
        if (redirs.length === 0) {
          Logger.println('No active TCP redirection for this application');
        } else {
          Logger.println('Enabled TCP redirections:');
          for (const { namespace, port } of redirs) {
            Logger.println(port + ' on ' + namespace);
          }
        }
      }
    }
  },
});
