import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { appIdOrNameArg } from '../global.args.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { onlyAddonsOpt, onlyAppsOpt, showAllOpt } from './service.opts.js';

export const serviceUnlinkAppCommand = {
  name: 'unlink-app',
  description: 'Remove an app from the dependencies',
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
    app: appIdOrNameOpt,
  },
  args: [appIdOrNameArg],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
    const [dependency] = params.args;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Application.unlink(ownerId, appId, dependency);
    Logger.println(`App ${dependency.app_id || dependency.app_name} successfully unlinked`);
  },
};
