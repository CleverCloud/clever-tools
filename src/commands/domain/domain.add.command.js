import { addDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { fqdnArg } from './domain.args.js';

export const domainAddCommand = {
  name: 'add',
  description: 'Add a domain name to an application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [fqdnArg],
  async execute(params) {
    const [fqdn] = params.args;
    const { alias, app: appIdOrName } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const encodedFqdn = encodeURIComponent(fqdn);

    await addDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
    Logger.println('Your domain has been successfully saved');
  },
};
