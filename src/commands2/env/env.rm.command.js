import { removeEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { sourceableEnvVarsListOption } from './env.options.js';

export const envRmCommand = defineCommand({
  description: 'Remove an environment variable from an application',
  since: '0.3.0',
  options: {
    'add-export': sourceableEnvVarsListOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg],
  async handler(options, envName) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

    Logger.println('Your environment variable has been successfully removed');
  },
});
