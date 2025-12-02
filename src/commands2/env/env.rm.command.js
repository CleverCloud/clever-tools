import { removeEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { sourceableEnvVarsListFlag } from './env.flags.js';

export const envRmCommand = defineCommand({
  description: 'Remove an environment variable from an application',
  flags: {
    'add-export': sourceableEnvVarsListFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [envVariableNameArg],
  async handler(flags, envName) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

    Logger.println('Your environment variable has been successfully removed');
  },
});
