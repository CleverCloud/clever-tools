import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as Namespaces from '../../models/namespaces.js';
import { aliasFlag, appIdOrNameFlag, humanJsonOutputFormatFlag } from '../global.flags.js';

export const tcpRedirsListNamespacesCommand = defineCommand({
  description: 'List the namespaces in which you can create new TCP redirections',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName, format } = flags;
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
