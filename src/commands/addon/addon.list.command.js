import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
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

export const addonListCommand = {
  name: 'list',
  description: 'List available add-ons',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute(params) {
    const { org: orgaIdOrName, format } = params.options;
    
      const ownerId = await Organisation.getId(orgaIdOrName);
      const addons = await Addon.list(ownerId);
    
      switch (format) {
        case 'json': {
          const formattedAddons = addons.map((addon) => {
            return {
              addonId: addon.id,
              creationDate: addon.creationDate,
              name: addon.name,
              planName: addon.plan.name,
              planSlug: addon.plan.slug,
              providerId: addon.provider.id,
              realId: addon.realId,
              region: addon.region,
              type: addon.provider.name,
            };
          });
          Logger.printJson(formattedAddons);
          break;
        }
        case 'human':
        default: {
          const formattedAddons = addons.map((addon) => {
            return [
              addon.plan.name + ' ' + addon.provider.name,
              addon.region,
              styleText(['bold', 'green'], addon.name),
              addon.id,
            ];
          });
          Logger.println(formatTable(formattedAddons));
        }
      }
  }
};
