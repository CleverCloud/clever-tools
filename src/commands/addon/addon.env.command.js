import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, envFormatOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import dedent from 'dedent';
import { getOperator } from '../../clever-client/operators.js';
import { formatTable } from '../../format-table.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import { findOwnerId, parseAddonOptions } from '../../models/addon.js';
import * as AppConfig from '../../models/app_configuration.js';
import { conf } from '../../models/configuration.js';
import { resolveAddonId } from '../../models/ids-resolver.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as User from '../../models/user.js';

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
    format: envFormatOpt
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
  }
};
