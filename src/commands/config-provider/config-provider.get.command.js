import { GetConfigProviderCommand } from '@clevercloud/client/cc-api-commands/config-provider/get-config-provider-command.js';
import { toNameEqualsValueString } from '@clevercloud/client/utils/environment-utils.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
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

    // The client returns an array of { name, value } objects, sorted by name
    const envVars =
      (await tolerateNotFound(clients.ccApi.send(new GetConfigProviderCommand({ addonId: realId })))) ?? [];

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
