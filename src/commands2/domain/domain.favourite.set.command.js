import { markFavouriteDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { fqdnArg } from './domain.args.js';

export const domainFavouriteSetCommand = defineCommand({
  description: 'Set the favourite domain for an application',
  since: '2.7.0',
  sinceDate: '2020-08-20',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [fqdnArg],
  async handler(options, fqdn) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await markFavouriteDomain({ id: ownerId, appId }, { fqdn }).then(sendToApi);
    Logger.println('Your favourite domain has been successfully set');
  },
});
