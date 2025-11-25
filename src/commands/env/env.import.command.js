import { updateAllEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as variables from '../../models/variables.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, importAsJsonOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { sourceableEnvVarsListOpt } from './env.opts.js';

export const envImportCommand = defineCommand({
  name: 'import',
  description:
    'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
  experimental: false,
  featureFlag: null,
  opts: {
    'add-export': sourceableEnvVarsListOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
    json: importAsJsonOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, json } = params.options;
    const format = json ? 'json' : 'name-equals-value';
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const envVars = await variables.readVariablesFromStdin(format);
    await updateAllEnvVars({ id: ownerId, appId }, envVars).then(sendToApi);

    Logger.println('Environment variables have been set');
  },
});
