import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { appIdOrNameArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { onlyAddonsOption, onlyAppsOption, showAllOption } from './service.options.js';

export const serviceUnlinkAppCommand = defineCommand({
  description: 'Remove an app from the dependencies',
  since: '0.5.0',
  options: {
    'only-apps': onlyAppsOption,
    'only-addons': onlyAddonsOption,
    'show-all': showAllOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [appIdOrNameArg],
  async handler(options, dependency) {
    const { alias, app: appIdOrName } = options;

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Application.unlink(ownerId, appId, dependency);
    Logger.println(`App ${dependency.app_id || dependency.app_name} successfully unlinked`);
  },
});
