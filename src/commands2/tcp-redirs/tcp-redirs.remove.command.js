import { removeTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { namespaceOption } from './tcp-redirs.options.js';

export const tcpRedirsRemoveCommand = defineCommand({
  description: 'Remove a TCP redirection from the application',
  since: '2.3.0',
  sinceDate: '2020-03-30',
  options: {
    namespace: namespaceOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.coerce.number().int(),
      description: 'port identifying the TCP redirection',
      placeholder: 'port',
    }),
  ],
  async handler(options, port) {
    const { alias, app: appIdOrName, namespace } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);

    Logger.println('Successfully removed tcp redirection.');
  },
});
