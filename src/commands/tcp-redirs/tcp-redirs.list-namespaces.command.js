import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as Namespaces from '../../models/namespaces.js';
import {
  aliasOpt,
  appIdOrNameOpt,
  colorOpt,
  humanJsonOutputFormatOpt,
  updateNotifierOpt,
  verboseOpt,
} from '../global.opts.js';

export const tcpRedirsListNamespacesCommand = defineCommand({
  name: 'list-namespaces',
  description: 'List the namespaces in which you can create new TCP redirections',
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
    const { ownerId } = await Application.resolveId(appIdOrName, alias);

    const namespaces = await Namespaces.getNamespaces(ownerId);

    namespaces.sort((a, b) => a.namespace.localeCompare(b.namespace));

    switch (format) {
      case 'json': {
        Logger.printJson(namespaces);
        break;
      }
      case 'human':
      default: {
        Logger.println('Available namespaces:');
        namespaces.forEach(({ namespace }) => {
          switch (namespace) {
            case 'cleverapps':
              Logger.println(`- ${namespace}: for redirections used with 'cleverapps.io' domain`);
              break;
            case 'default':
              Logger.println(`- ${namespace}: for redirections used with custom domains`);
              break;
            default:
              Logger.println(`- ${namespace}`);
          }
        });
        break;
      }
    }
  },
});
