import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { addonNameArg } from './addon.args.js';

export const addonRenameCommand = defineCommand({
  name: 'rename',
  description: 'Rename an add-on',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [addonNameArg, addonIdOrNameArg],
  async execute(params) {
    const [addon, newName] = params.args;
    const { org: orgaIdOrName } = params.options;

    const ownerId = await Organisation.getId(orgaIdOrName);
    await Addon.rename(ownerId, addon, newName);

    Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
  },
});
