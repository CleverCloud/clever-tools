import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { getDomainObject, getFavouriteDomain } from '../../models/domain.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

export const domainFavouriteCommand = defineCommand({
  description: 'Manage the favourite domain name for an application',
  since: '2.7.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
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
