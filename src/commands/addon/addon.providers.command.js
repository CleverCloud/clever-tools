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

export const addonProvidersCommand = {
  name: 'providers',
  description: 'List available add-on providers',
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
    const { format } = params.options;
    
      const providers = await Addon.listProviders();
    
      switch (format) {
        case 'json': {
          const formattedProviders = providers.map((provider) => ({
            id: provider.id,
            name: provider.name,
            shortDesc: provider.shortDesc,
            regions: provider.regions,
            plans: provider.plans.map((plan) => ({
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
            })),
          }));
          Logger.printJson(formattedProviders);
          break;
        }
        case 'human':
        default: {
          const formattedProviders = providers.map((provider) => {
            return [styleText('bold', provider.id), provider.name, provider.shortDesc || ''];
          });
          Logger.println(formatTable(formattedProviders));
        }
      }
  }
};
