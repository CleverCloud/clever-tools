import { SetPrimaryDomainCommand } from '@clevercloud/client/cc-api-commands/domain/set-primary-domain-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { fqdnArg } from './domain.args.js';

export const domainFavouriteSetCommand = defineCommand({
  description: 'Set the favourite domain for an application',
  since: '2.7.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [fqdnArg],
  async handler(options, fqdn) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(new SetPrimaryDomainCommand({ ownerId, applicationId: appId, domain: fqdn }));
    Logger.println('Your favourite domain has been successfully set');
  },
});
