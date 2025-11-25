import { addonNameArg } from './addon.args.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt } from '../global.opts.js';
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

export const addonRenameCommand = {
  name: 'rename',
  description: 'Rename an add-on',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt
  },
  args: [
    addonNameArg,
    addonIdOrNameArg,
  ],
  async execute(params) {
    const [addon, newName] = params.args;
      const { org: orgaIdOrName } = params.options;
    
      const ownerId = await Organisation.getId(orgaIdOrName);
      await Addon.rename(ownerId, addon, newName);
    
      Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
  }
};
