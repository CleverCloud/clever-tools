import { getConfigProviderEnv } from '@clevercloud/client/esm/api/v4/addon.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envFormatOption } from '../global.options.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

export const configProviderGetCommand = defineCommand({
  description: 'List environment variables of a configuration provider',
  since: '4.6.0',
  options: {
    format: envFormatOption,
  },
  args: [configProviderIdOrNameArg],
  async handler(options, addonIdOrRealIdOrName) {
    const { format } = options;
    const { realId } = await resolveConfigProviderId(addonIdOrRealIdOrName);

    // API returns an array of { name, value } objects
    const envVars = await getConfigProviderEnv({ configurationProviderId: realId }).then(sendToApi);

    switch (format) {
      case 'json':
        Logger.printJson(envVars);
        break;
      case 'shell':
        Logger.println(toNameEqualsValueString(envVars, { addExports: true }));
        break;
      case 'human':
      default:
        Logger.println(toNameEqualsValueString(envVars, { addExports: false }));
    }
  },
});
