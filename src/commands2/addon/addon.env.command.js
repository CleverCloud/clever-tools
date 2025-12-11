import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { findOwnerId } from '../../models/addon.js';
import { resolveAddonId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const addonEnvCommand = defineCommand({
  description: 'List environment variables for an add-on',
  since: '2.11.0',
  sinceDate: '2023-07-25',
  options: {
    org: orgaIdOrNameOption,
    format: envFormatOption,
  },
  args: [],
  async handler(options, addonIdOrRealId) {
    const { org, format } = options;

    const addonId = await resolveAddonId(addonIdOrRealId);
    const ownerId = await findOwnerId(org, addonId);

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
