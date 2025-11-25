import { addTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { namespaceOpt } from './tcp-redirs.opts.js';

export const tcpRedirsAddCommand = {
  name: 'add',
  description: 'Add a new TCP redirection to the application',
  experimental: false,
  featureFlag: null,
  opts: {
    namespace: namespaceOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, namespace } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const { port } = await addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi);
    Logger.println('Successfully added tcp redirection on port: ' + port);
  },
};
