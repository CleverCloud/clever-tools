import { updateEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const envSetCommand = defineCommand({
  description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
  since: '0.3.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [envVariableNameArg, envVariableValueArg],
  async handler(options, envName, value) {
    const { alias, app: appIdOrName } = options;

    const nameIsValid = validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);

    Logger.println('Your environment variable has been successfully saved');
  },
});
