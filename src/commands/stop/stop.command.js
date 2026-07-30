import { UndeployApplicationCommand } from '@clevercloud/client/cc-api-commands/application/undeploy-application-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const stopCommand = defineCommand({
  description: 'Stop a running application',
  since: '0.2.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(new UndeployApplicationCommand({ ownerId, applicationId: appId }));
    Logger.printSuccess('Application successfully stopped!');
  },
});
