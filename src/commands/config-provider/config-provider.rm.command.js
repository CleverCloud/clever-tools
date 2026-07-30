import { GetConfigProviderCommand } from '@clevercloud/client/cc-api-commands/config-provider/get-config-provider-command.js';
import { UpdateConfigProviderCommand } from '@clevercloud/client/cc-api-commands/config-provider/update-config-provider-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { envVariableNameArg } from '../global.args.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

export const configProviderRmCommand = defineCommand({
  description: 'Remove an environment variable from a configuration provider',
  since: '4.6.0',
  options: {},
  args: [configProviderIdOrNameArg, envVariableNameArg],
  async handler(_options, addonIdOrRealIdOrName, varName) {
    const { realId } = await resolveConfigProviderId(addonIdOrRealIdOrName);

    // The client returns an array of { name, value } objects
    const envVars =
      (await tolerateNotFound(clients.ccApi.send(new GetConfigProviderCommand({ addonId: realId })))) ?? [];
    const filteredEnvVars = envVars.filter((v) => v.name !== varName);

    await clients.ccApi.send(new UpdateConfigProviderCommand({ addonId: realId, environment: filteredEnvVars }));

    Logger.println('Environment variable has been removed');
  },
});
