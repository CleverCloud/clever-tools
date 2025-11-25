import { get as getApp } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { getDomainObject, getFavouriteDomain } from '../../models/domain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  aliasOpt,
  appIdOrNameOpt,
  colorOpt,
  humanJsonOutputFormatOpt,
  updateNotifierOpt,
  verboseOpt,
} from '../global.opts.js';

export const domainCommand = {
  name: 'domain',
  description: 'Manage domain names for an application',
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
};
