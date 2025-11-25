import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { Logger } from '../../logger.js';
import { findOwnerId } from '../../models/addon.js';
import { resolveAddonId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { colorOpt, envFormatOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const addonEnvCommand = {
  name: 'env',
  description: 'List environment variables for an add-on',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: envFormatOpt,
  },
  args: [],
  async execute(params) {
    const { org, format } = params.options;
    const [addonIdOrRealId] = params.args;

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
};
