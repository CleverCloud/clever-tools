import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { addonIdOrNameArg } from '../global.args.js';
import { orgaIdOrNameFlag } from '../global.flags.js';
import { addonNameArg } from './addon.args.js';

export const addonRenameCommand = defineCommand({
  description: 'Rename an add-on',
  flags: {
    org: orgaIdOrNameFlag,
  },
  args: [addonNameArg, addonIdOrNameArg],
  async handler(flags, addon, newName) {
    const { org: orgaIdOrName } = flags;

    const ownerId = await Organisation.getId(orgaIdOrName);
    await Addon.rename(ownerId, addon, newName);

    Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
  },
});
