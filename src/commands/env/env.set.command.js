import { updateEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { sourceableEnvVarsListOpt } from './env.opts.js';

export const envSetCommand = {
  name: 'set',
  description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
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
  args: [envVariableNameArg, envVariableValueArg],
  async execute(params) {
    const [envName, value] = params.args;
    const { alias, app: appIdOrName } = params.options;

    const nameIsValid = validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);

    Logger.println('Your environment variable has been successfully saved');
  },
};
