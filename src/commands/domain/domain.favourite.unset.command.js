import { unmarkFavouriteDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const domainFavouriteUnsetCommand = {
  name: 'unset',
  description: 'Unset the favourite domain for an application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await unmarkFavouriteDomain({ id: ownerId, appId }).then(sendToApi);
    Logger.println('Favourite domain has been successfully unset');
  },
};
