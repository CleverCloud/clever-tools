import { addonIdOrNameArg } from '../global.args.js';
import { onlyAppsOpt, onlyAddonsOpt, showAllOpt } from './service.opts.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Application from '../../models/application.js';

export const serviceUnlinkAddonCommand = {
  name: 'unlink-addon',
  description: 'Unlink an add-on from this application',
  experimental: false,
  featureFlag: null,
  opts: {
    'only-apps': onlyAppsOpt,
    'only-addons': onlyAddonsOpt,
    'show-all': showAllOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    addonIdOrNameArg,
  ],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
      const [addon] = params.args;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    
      await Addon.unlink(ownerId, appId, addon);
      Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully unlinked`);
  }
};
