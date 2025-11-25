import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, confirmAddonDeletionOpt } from '../global.opts.js';
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

export const addonDeleteCommand = {
  name: 'delete',
  description: 'Delete an add-on',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    yes: confirmAddonDeletionOpt
  },
  args: [
    addonIdOrNameArg,
  ],
  async execute(params) {
    const { yes: skipConfirmation, org: orgaIdOrName } = params.options;
      const [addon] = params.args;
    
      let ownerId = await Organisation.getId(orgaIdOrName);
      if (ownerId == null && addon.addon_id != null) {
        ownerId = await Addon.findOwnerId(ownerId, addon.addon_id);
      }
      if (ownerId == null && addon.addon_name != null) {
        const foundAddon = await Addon.findByName(addon.addon_name);
        ownerId = foundAddon.orgaId;
      }
    
      await Addon.deleteAddon(ownerId, addon, skipConfirmation);
    
      Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully deleted`);
  }
};
