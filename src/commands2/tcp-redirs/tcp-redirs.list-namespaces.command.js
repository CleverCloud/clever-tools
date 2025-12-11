import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as Namespaces from '../../models/namespaces.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

export const tcpRedirsListNamespacesCommand = defineCommand({
  description: 'List the namespaces in which you can create new TCP redirections',
  since: '2.3.0',
  sinceDate: '2020-03-30',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
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
