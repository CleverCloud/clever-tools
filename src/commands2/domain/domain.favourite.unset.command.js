import { unmarkFavouriteDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const domainFavouriteUnsetCommand = defineCommand({
  description: 'Unset the favourite domain for an application',
  since: '2.7.0',
  sinceDate: '2020-08-20',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await unmarkFavouriteDomain({ id: ownerId, appId }).then(sendToApi);
    Logger.println('Favourite domain has been successfully unset');
  },
});
