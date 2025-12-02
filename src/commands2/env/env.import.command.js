import { updateAllEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as variables from '../../models/variables.js';
import { aliasFlag, appIdOrNameFlag, importAsJsonFlag } from '../global.flags.js';
import { sourceableEnvVarsListFlag } from './env.flags.js';

export const envImportCommand = defineCommand({
  description:
    'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
  flags: {
    'add-export': sourceableEnvVarsListFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
    json: importAsJsonFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName, json } = flags;
    const format = json ? 'json' : 'name-equals-value';
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const envVars = await variables.readVariablesFromStdin(format);
    await updateAllEnvVars({ id: ownerId, appId }, envVars).then(sendToApi);

    Logger.println('Environment variables have been set');
  },
});
