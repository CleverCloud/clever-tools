import { namespaceOpt } from './tcp-redirs.opts.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { integer as integerParser } from '../../parsers.js';
import { addTcpRedir, getTcpRedirs, removeTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as Namespaces from '../../models/namespaces.js';
import { sendToApi } from '../../models/send-to-api.js';

export const tcpRedirsRemoveCommand = {
  name: 'remove',
  description: 'Remove a TCP redirection from the application',
  experimental: false,
  featureFlag: null,
  opts: {
    namespace: namespaceOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    {
      name: 'port',
      description: 'port identifying the TCP redirection',
      parser: integerParser,
      complete: null
    },
  ],
  async execute(params) {
    const [port] = params.args;
      const { alias, app: appIdOrName, namespace } = params.options;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    
      await removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);
    
      Logger.println('Successfully removed tcp redirection.');
  }
};
