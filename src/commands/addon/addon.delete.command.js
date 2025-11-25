import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, confirmAddonDeletionOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

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
    yes: confirmAddonDeletionOpt,
  },
  args: [addonIdOrNameArg],
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
  },
};
