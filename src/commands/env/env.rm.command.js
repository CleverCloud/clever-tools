import { DeleteEnvironmentVariableCommand } from '@clevercloud/client/cc-api-commands/environment/delete-environment-variable-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const envRmCommand = defineCommand({
  description: 'Remove an environment variable from an application',
  since: '0.3.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg],
  async handler(options, envName) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(new DeleteEnvironmentVariableCommand({ ownerId, applicationId: appId, name: envName }));

    Logger.println('Your environment variable has been successfully removed');
  },
});
