import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Application from '../../models/application.js';
import { addonIdOrNameArg } from '../global.args.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { onlyAddonsFlag, onlyAppsFlag, showAllFlag } from './service.flags.js';

export const serviceLinkAddonCommand = defineCommand({
  description: 'Link an existing add-on to this application',
  flags: {
    'only-apps': onlyAppsFlag,
    'only-addons': onlyAddonsFlag,
    'show-all': showAllFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [addonIdOrNameArg],
  async handler(flags, addon) {
    const { alias, app: appIdOrName } = flags;

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Addon.link(ownerId, appId, addon);
    Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully linked`);
  },
});
