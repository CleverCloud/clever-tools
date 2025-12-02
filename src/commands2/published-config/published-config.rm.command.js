import { getAllExposedEnvVars, updateAllExposedEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const publishedConfigRmCommand = defineCommand({
  description: 'Remove a published configuration variable from an application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [envVariableNameArg],
  async handler(flags, varName) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
    delete publishedConfigs[varName];
    await updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

    Logger.println('Your published config item has been successfully removed');
  },
});
