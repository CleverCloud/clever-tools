import { get as getApp } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { getDomainObject, getFavouriteDomain } from '../../models/domain.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

export const domainCommand = defineCommand({
  description: 'Manage domain names for an application',
  since: '0.2.0',
  sinceDate: '2015-07-28',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const app = await getApp({ id: ownerId, appId }).then(sendToApi);
    const favouriteDomain = await getFavouriteDomain({ ownerId, appId });

    const domains = app.vhosts.map((vhost) => getDomainObject(vhost.fqdn, favouriteDomain));

    switch (format) {
      case 'json':
        Logger.printJson(domains);
        break;
      default:
        domains.forEach((domain) => {
          Logger.println(`${domain.isFavourite ? '* ' : '  '}${domain.domainWithPathPrefix}`);
        });
        break;
    }
  },
});
