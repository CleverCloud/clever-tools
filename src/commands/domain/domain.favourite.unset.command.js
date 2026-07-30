import { UnsetPrimaryDomainCommand } from '@clevercloud/client/cc-api-commands/domain/unset-primary-domain-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const domainFavouriteUnsetCommand = defineCommand({
  description: 'Unset the favourite domain for an application',
  since: '2.7.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(new UnsetPrimaryDomainCommand({ ownerId, applicationId: appId }));
    Logger.println('Favourite domain has been successfully unset');
  },
});
