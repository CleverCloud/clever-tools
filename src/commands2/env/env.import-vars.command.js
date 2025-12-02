import { updateEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { sourceableEnvVarsListFlag } from './env.flags.js';

export const envImportVarsCommand = defineCommand({
  description:
    'Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment',
  flags: {
    'add-export': sourceableEnvVarsListFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Comma separated list of names of the environment variables',
      placeholder: 'variable-names',
    }),
  ],
  async handler(flags, envNames) {
    const { alias, app: appIdOrName } = flags;

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
