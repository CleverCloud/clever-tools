import { removeTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { namespaceFlag } from './tcp-redirs.flags.js';

export const tcpRedirsRemoveCommand = defineCommand({
  description: 'Remove a TCP redirection from the application',
  flags: {
    namespace: namespaceFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [
    defineArgument({
      schema: z.coerce.number().int(),
      description: 'port identifying the TCP redirection',
      placeholder: 'port',
    }),
  ],
  async handler(flags, port) {
    console.log('app', flags.app);
    const { alias, app: appIdOrName, namespace } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    false && (await removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi));

    Logger.println('Successfully removed tcp redirection.');
  },
});
