import { CreateDomainCommand } from '@clevercloud/client/cc-api-commands/domain/create-domain-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { fqdnArg } from './domain.args.js';

export const domainAddCommand = defineCommand({
  description: 'Add a domain name to an application',
  since: '0.2.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [fqdnArg],
  async handler(options, fqdn) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(new CreateDomainCommand({ ownerId, applicationId: appId, domain: fqdn }));
    Logger.println('Your domain has been successfully saved');
  },
});
