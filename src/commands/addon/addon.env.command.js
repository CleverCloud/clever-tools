import { GetEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/get-environment-command.js';
import { toNameEqualsValueString } from '@clevercloud/client/utils/environment-utils.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveAddon } from '../../models/ids-resolver.js';
import { envFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const addonEnvCommand = defineCommand({
  description: 'List environment variables for an add-on',
  since: '2.11.0',
  options: {
    org: { ...orgaIdOrNameOption, deprecated: 'organisation is now resolved automatically' },
    format: envFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Add-on ID or real ID',
      placeholder: 'addon-id',
    }),
  ],
  async handler(options, addonIdOrRealId) {
    const { format } = options;

    const { ownerId, addonId } = await resolveAddon(addonIdOrRealId);

    const { environment: envFromAddon } = await clients.ccApi.send(new GetEnvironmentCommand({ ownerId, addonId }));

    switch (format) {
      case 'json': {
        const envFromAddonJson = Object.fromEntries(envFromAddon.map(({ name, value }) => [name, value]));
        Logger.println(JSON.stringify(envFromAddonJson, null, 2));
        break;
      }

      case 'shell':
        Logger.println(toNameEqualsValueString(envFromAddon, { addExports: true }));
        break;

      case 'human':
      default:
        Logger.println(toNameEqualsValueString(envFromAddon, { addExports: false }));
    }
  },
});
