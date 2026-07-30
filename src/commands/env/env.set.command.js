import { CreateOrUpdateEnvironmentVariableCommand } from '@clevercloud/client/cc-api-commands/environment/create-or-update-environment-variable-command.js';
import { validateName } from '@clevercloud/client/utils/environment-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const envSetCommand = defineCommand({
  description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
  since: '0.3.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg, envVariableValueArg],
  async handler(options, envName, value) {
    const { alias, app: appIdOrName } = options;

    const nameIsValid = validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await clients.ccApi.send(
      new CreateOrUpdateEnvironmentVariableCommand({ ownerId, applicationId: appId, name: envName, value }),
    );

    Logger.println('Your environment variable has been successfully saved');
  },
});
