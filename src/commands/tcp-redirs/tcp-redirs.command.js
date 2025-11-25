import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { addTcpRedir, getTcpRedirs, removeTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as Namespaces from '../../models/namespaces.js';
import { sendToApi } from '../../models/send-to-api.js';

export const tcpRedirsCommand = {
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
    format: humanJsonOutputFormatOpt
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
  }
};
