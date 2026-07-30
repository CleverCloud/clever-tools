import { CreateOrUpdateEnvironmentVariableCommand } from '@clevercloud/client/cc-api-commands/environment/create-or-update-environment-variable-command.js';
import { validateName } from '@clevercloud/client/utils/environment-utils.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const envImportVarsCommand = defineCommand({
  description:
    'Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment',
  since: '2.0.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Comma separated list of names of the environment variables',
      placeholder: 'variable-names',
    }),
  ],
  async handler(options, envNames) {
    const { alias, app: appIdOrName } = options;

    for (const envName of envNames) {
      const nameIsValid = validateName(envName);
      if (!nameIsValid) {
        throw new Error(`Environment variable name ${envName} is invalid`);
      }
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    for (const envName of envNames) {
      const value = process.env[envName] || '';
      await clients.ccApi.send(
        new CreateOrUpdateEnvironmentVariableCommand({ ownerId, applicationId: appId, name: envName, value }),
      );
    }

    Logger.println('Your environment variables have been successfully saved');
  },
});
