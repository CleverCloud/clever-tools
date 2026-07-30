import { ListDomainCommand } from '@clevercloud/client/cc-api-commands/domain/list-domain-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { getDomainObject } from '../../models/domain.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

export const domainCommand = defineCommand({
  description: 'Manage domain names for an application',
  since: '0.2.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const rawDomains = await clients.ccApi.send(new ListDomainCommand({ ownerId, applicationId: appId }));

    const domains = rawDomains.map(({ domain, isPrimary }) => getDomainObject(domain, isPrimary ? domain : null));

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
