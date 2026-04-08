import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { resolveAddon } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
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

    const envFromAddon = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);

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
