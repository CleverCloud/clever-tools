import { CreateTcpRedirectionCommand } from '@clevercloud/client/cc-api-commands/tcp-redirection/create-tcp-redirection-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { namespaceOption } from './tcp-redirs.options.js';

export const tcpRedirsAddCommand = defineCommand({
  description: 'Add a new TCP redirection to the application',
  since: '2.3.0',
  options: {
    namespace: namespaceOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, namespace } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const { port } = await clients.ccApi.send(
      new CreateTcpRedirectionCommand({ ownerId, applicationId: appId, namespace }),
    );
    Logger.println('Successfully added tcp redirection on port: ' + port);
  },
});
