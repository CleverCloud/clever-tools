import { removeDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { fqdnArg } from './domain.args.js';

export const domainRmCommand = defineCommand({
  description: 'Remove a domain name from an application',
  since: '0.2.0',
  sinceDate: '2015-07-28',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [fqdnArg],
  async handler(options, fqdn) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const encodedFqdn = encodeURIComponent(fqdn);

    await removeDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
    Logger.println('Your domain has been successfully removed');
  },
});
