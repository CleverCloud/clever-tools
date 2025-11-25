import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { getDomainObject, getFavouriteDomain } from '../../models/domain.js';
import {
  aliasOpt,
  appIdOrNameOpt,
  colorOpt,
  humanJsonOutputFormatOpt,
  updateNotifierOpt,
  verboseOpt,
} from '../global.opts.js';

export const domainFavouriteCommand = defineCommand({
  name: 'favourite',
  description: 'Manage the favourite domain name for an application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, format } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const favouriteDomain = await getFavouriteDomain({ ownerId, appId });

    switch (format) {
      case 'json':
        const domain = getDomainObject(favouriteDomain, favouriteDomain);
        Logger.printJson(domain);
        break;
      default:
        if (favouriteDomain == null) {
          return Logger.println('No favourite domain set');
        }
        Logger.println(favouriteDomain);
        break;
    }
  },
});
