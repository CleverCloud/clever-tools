import { DeleteTcpRedirectionCommand } from '@clevercloud/client/cc-api-commands/tcp-redirection/delete-tcp-redirection-command.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { namespaceOption } from './tcp-redirs.options.js';

export const tcpRedirsRemoveCommand = defineCommand({
  description: 'Remove a TCP redirection from the application',
  since: '2.3.0',
  options: {
    namespace: namespaceOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.coerce.number().int().min(1025, 65535),
      description: 'port identifying the TCP redirection',
      placeholder: 'port',
    }),
  ],
  async handler(options, port) {
    const { alias, app: appIdOrName, namespace } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(new DeleteTcpRedirectionCommand({ ownerId, applicationId: appId, port, namespace }));

    Logger.println('Successfully removed tcp redirection.');
  },
});
