import { GetExposedEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/get-exposed-environment-command.js';
import { UpdateExposedEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/update-exposed-environment-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const publishedConfigRmCommand = defineCommand({
  description: 'Remove a published configuration variable from an application',
  since: '0.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg],
  async handler(options, varName) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    // The client returns an array of { name, value } objects
    const publishedConfigs =
      (await tolerateNotFound(
        clients.ccApi.send(new GetExposedEnvironmentCommand({ ownerId, applicationId: appId })),
      )) ?? [];
    const filteredConfigs = publishedConfigs.filter((v) => v.name !== varName);

    await clients.ccApi.send(
      new UpdateExposedEnvironmentCommand({ ownerId, applicationId: appId, environment: filteredConfigs }),
    );

    Logger.println('Your published config item has been successfully removed');
  },
});
