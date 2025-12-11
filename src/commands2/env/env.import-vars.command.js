import { updateEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { sourceableEnvVarsListOption } from './env.options.js';

export const envImportVarsCommand = defineCommand({
  description:
    'Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment',
  since: '2.0.0',
  sinceDate: '2020-03-06',
  options: {
    'add-export': sourceableEnvVarsListOption,
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
      await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
    }

    Logger.println('Your environment variables have been successfully saved');
  },
});
