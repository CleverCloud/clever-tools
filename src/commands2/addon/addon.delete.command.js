import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { addonIdOrNameArg } from '../global.args.js';
import { confirmAddonDeletionFlag, orgaIdOrNameFlag } from '../global.flags.js';

export const addonDeleteCommand = defineCommand({
  description: 'Delete an add-on',
  flags: {
    org: orgaIdOrNameFlag,
    yes: confirmAddonDeletionFlag,
  },
  args: [addonIdOrNameArg],
  async handler(flags, addon) {
    const { yes: skipConfirmation, org: orgaIdOrName } = flags;

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
});
