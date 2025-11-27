import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { appIdOrNameArg } from '../global.args.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { onlyAddonsFlag, onlyAppsFlag, showAllFlag } from './service.flags.js';

export const serviceLinkAppCommand = defineCommand({
  description: 'Add an existing app as a dependency',
  flags: {
    'only-apps': onlyAppsFlag,
    'only-addons': onlyAddonsFlag,
    'show-all': showAllFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [appIdOrNameArg],
  async handler(flags, dependency) {
    const { alias, app: appIdOrName } = flags;

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Application.link(ownerId, appId, dependency);
    Logger.println(`App ${dependency.app_id || dependency.app_name} successfully linked`);
  },
});
