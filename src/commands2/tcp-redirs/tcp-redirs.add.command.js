import { addTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { namespaceFlag } from './tcp-redirs.flags.js';

export const tcpRedirsAddCommand = defineCommand({
  description: 'Add a new TCP redirection to the application',
  flags: {
    namespace: namespaceFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName, namespace } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const { port } = await addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi);
    Logger.println('Successfully added tcp redirection on port: ' + port);
  },
});
