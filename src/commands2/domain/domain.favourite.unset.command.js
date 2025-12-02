import { unmarkFavouriteDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const domainFavouriteUnsetCommand = defineCommand({
  description: 'Unset the favourite domain for an application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await unmarkFavouriteDomain({ id: ownerId, appId }).then(sendToApi);
    Logger.println('Favourite domain has been successfully unset');
  },
});
