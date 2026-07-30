import { GetExposedEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/get-exposed-environment-command.js';
import { UpdateExposedEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/update-exposed-environment-command.js';
import { validateName } from '@clevercloud/client/utils/environment-utils.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const publishedConfigSetCommand = defineCommand({
  description: 'Add or update a published configuration item named <variable-name> with the value <variable-value>',
  since: '0.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg, envVariableValueArg],
  async handler(options, varName, varValue) {
    const { alias, app: appIdOrName } = options;

    const nameIsValid = validateName(varName);
    if (!nameIsValid) {
      throw new Error(`Published config name ${varName} is invalid`);
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    // The client returns an array of { name, value } objects
    const publishedConfigs =
      (await tolerateNotFound(
        clients.ccApi.send(new GetExposedEnvironmentCommand({ ownerId, applicationId: appId })),
      )) ?? [];
    const existingIndex = publishedConfigs.findIndex((v) => v.name === varName);

    if (existingIndex >= 0) {
      publishedConfigs[existingIndex].value = varValue;
    } else {
      publishedConfigs.push({ name: varName, value: varValue });
    }

    await clients.ccApi.send(
      new UpdateExposedEnvironmentCommand({ ownerId, applicationId: appId, environment: publishedConfigs }),
    );

    Logger.println('Your published config item has been successfully saved');
  },
});
