import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Organisation from '../../models/organisation.js';
import { addonIdOrNameArg } from '../global.args.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { addonNameArg } from './addon.args.js';

export const addonRenameCommand = defineCommand({
  description: 'Rename an add-on',
  since: '0.3.0',
  sinceDate: '2015-09-23',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [addonNameArg, addonIdOrNameArg],
  async handler(options, addon, newName) {
    const { org: orgaIdOrName } = options;

    const ownerId = await Organisation.getId(orgaIdOrName);
    await Addon.rename(ownerId, addon, newName);

    Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
  },
});
