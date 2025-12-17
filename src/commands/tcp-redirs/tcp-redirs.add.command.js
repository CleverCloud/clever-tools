import { addTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { namespaceOption } from './tcp-redirs.options.js';

export const tcpRedirsAddCommand = defineCommand({
  description: 'Add a new TCP redirection to the application',
  since: '2.3.0',
  sinceDate: '2020-03-30',
  options: {
    namespace: namespaceOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, namespace } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const { port } = await addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi);
    Logger.println('Successfully added tcp redirection on port: ' + port);
  },
});
