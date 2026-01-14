import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Application from '../../models/application.js';
import { addonIdOrNameArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const serviceLinkAddonCommand = defineCommand({
  description: 'Link an existing add-on to this application',
  since: '0.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [addonIdOrNameArg],
  async handler(options, addon) {
    const { alias, app: appIdOrName } = options;

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Addon.link(ownerId, appId, addon);
    Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully linked`);
  },
});
