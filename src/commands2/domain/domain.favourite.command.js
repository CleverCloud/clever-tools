import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { getDomainObject, getFavouriteDomain } from '../../models/domain.js';
import { aliasFlag, appIdOrNameFlag, humanJsonOutputFormatFlag } from '../global.flags.js';

export const domainFavouriteCommand = defineCommand({
  description: 'Manage the favourite domain name for an application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName, format } = flags;
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
