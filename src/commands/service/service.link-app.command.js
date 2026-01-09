import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { appIdOrNameArg } from '../global.args.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const serviceLinkAppCommand = defineCommand({
  description: 'Add an existing app as a dependency',
  since: '0.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [appIdOrNameArg],
  async handler(options, dependency) {
    const { alias, app: appIdOrName } = options;

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Application.link(ownerId, appId, dependency);
    Logger.println(`App ${dependency.app_id || dependency.app_name} successfully linked`);
  },
});
