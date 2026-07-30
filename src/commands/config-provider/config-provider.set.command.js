import { GetConfigProviderCommand } from '@clevercloud/client/cc-api-commands/config-provider/get-config-provider-command.js';
import { UpdateConfigProviderCommand } from '@clevercloud/client/cc-api-commands/config-provider/update-config-provider-command.js';
import { validateName } from '@clevercloud/client/utils/environment-utils.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { envVariableNameArg, envVariableValueArg } from '../global.args.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

export const configProviderSetCommand = defineCommand({
  description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
  since: '4.6.0',
  options: {},
  args: [configProviderIdOrNameArg, envVariableNameArg, envVariableValueArg],
  async handler(_options, addonIdOrRealIdOrName, varName, varValue) {
    const nameIsValid = validateName(varName);
    if (!nameIsValid) {
      throw new Error(`Variable name '${varName}' is invalid`);
    }

    const { realId } = await resolveConfigProviderId(addonIdOrRealIdOrName);

    // The client returns an array of { name, value } objects
    const envVars =
      (await tolerateNotFound(clients.ccApi.send(new GetConfigProviderCommand({ addonId: realId })))) ?? [];
    const existingIndex = envVars.findIndex((v) => v.name === varName);

    if (existingIndex >= 0) {
      envVars[existingIndex].value = varValue;
    } else {
      envVars.push({ name: varName, value: varValue });
    }

    await clients.ccApi.send(new UpdateConfigProviderCommand({ addonId: realId, environment: envVars }));

    Logger.println('Environment variable has been set');
  },
});
