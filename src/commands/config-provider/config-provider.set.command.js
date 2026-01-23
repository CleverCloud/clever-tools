import { getConfigProviderEnv, updateConfigProviderEnv } from '@clevercloud/client/esm/api/v4/addon.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

export const configProviderSetCommand = defineCommand({
  description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
  since: 'unreleased',
  options: {},
  args: [configProviderIdOrNameArg, envVariableNameArg, envVariableValueArg],
  async handler(_options, addonIdOrRealIdOrName, varName, varValue) {
    const nameIsValid = validateName(varName);
    if (!nameIsValid) {
      throw new Error(`Variable name '${varName}' is invalid`);
    }

    const { realId } = await resolveConfigProviderId(addonIdOrRealIdOrName);

    // API returns an array of { name, value } objects
    const envVars = await getConfigProviderEnv({ configurationProviderId: realId }).then(sendToApi);
    const existingIndex = envVars.findIndex((v) => v.name === varName);

    if (existingIndex >= 0) {
      envVars[existingIndex].value = varValue;
    } else {
      envVars.push({ name: varName, value: varValue });
    }

    await updateConfigProviderEnv({ configurationProviderId: realId }, envVars).then(sendToApi);

    Logger.println('Environment variable has been set');
  },
});
