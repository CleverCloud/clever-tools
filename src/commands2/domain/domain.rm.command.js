import { removeDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { fqdnArg } from './domain.args.js';

export const domainRmCommand = defineCommand({
  description: 'Remove a domain name from an application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [fqdnArg],
  async handler(flags, fqdn) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const encodedFqdn = encodeURIComponent(fqdn);

    await removeDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
    Logger.println('Your domain has been successfully removed');
  },
});
