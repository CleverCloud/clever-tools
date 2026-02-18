import { getConfigProviderEnv, updateConfigProviderEnv } from '@clevercloud/client/esm/api/v4/addon.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg } from '../global.args.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

export const configProviderRmCommand = defineCommand({
  description: 'Remove an environment variable from a configuration provider',
  since: '4.6.0',
  options: {},
  args: [configProviderIdOrNameArg, envVariableNameArg],
  async handler(_options, addonIdOrRealIdOrName, varName) {
    const { realId } = await resolveConfigProviderId(addonIdOrRealIdOrName);

    // API returns an array of { name, value } objects
    const envVars = await getConfigProviderEnv({ configurationProviderId: realId }).then(sendToApi);
    const filteredEnvVars = envVars.filter((v) => v.name !== varName);

    await updateConfigProviderEnv({ configurationProviderId: realId }, filteredEnvVars).then(sendToApi);

    Logger.println('Environment variable has been removed');
  },
});
