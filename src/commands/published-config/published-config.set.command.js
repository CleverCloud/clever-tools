import { getAllExposedEnvVars, updateAllExposedEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const publishedConfigSetCommand = defineCommand({
  description: 'Add or update a published configuration item named <variable-name> with the value <variable-value>',
  since: '0.5.0',
  sinceDate: '2016-06-24',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg, envVariableValueArg],
  async handler(options, varName, varValue) {
    const { alias, app: appIdOrName } = options;

    const nameIsValid = validateName(varName);
    if (!nameIsValid) {
      throw new Error(`Published config name ${varName} is invalid`);
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
    publishedConfigs[varName] = varValue;
    await updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

    Logger.println('Your published config item has been successfully saved');
  },
});
