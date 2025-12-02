import { markFavouriteDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { fqdnArg } from './domain.args.js';

export const domainFavouriteSetCommand = defineCommand({
  description: 'Set the favourite domain for an application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [fqdnArg],
  async handler(flags, fqdn) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await markFavouriteDomain({ id: ownerId, appId }, { fqdn }).then(sendToApi);
    Logger.println('Your favourite domain has been successfully set');
  },
});
