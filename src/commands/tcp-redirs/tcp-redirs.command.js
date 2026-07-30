import { ListTcpRedirectionCommand } from '@clevercloud/client/cc-api-commands/tcp-redirection/list-tcp-redirection-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

export const tcpRedirsCommand = defineCommand({
  description: 'Control the TCP redirections from reverse proxies to your application',
  since: '2.3.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const redirs = await clients.ccApi.send(new ListTcpRedirectionCommand({ ownerId, applicationId: appId }));

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
