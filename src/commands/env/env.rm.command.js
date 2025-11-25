import { removeEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { sourceableEnvVarsListOpt } from './env.opts.js';

export const envRmCommand = defineCommand({
  name: 'rm',
  description: 'Remove an environment variable from an application',
  experimental: false,
  featureFlag: null,
  opts: {
    'add-export': sourceableEnvVarsListOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [envVariableNameArg],
  async execute(params) {
    const [envName] = params.args;
    const { alias, app: appIdOrName } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

    Logger.println('Your environment variable has been successfully removed');
  },
});
