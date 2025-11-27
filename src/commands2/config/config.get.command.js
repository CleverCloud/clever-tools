import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { configurationNameArg } from './config.args.js';

export const configGetCommand = defineCommand({
  description: 'Display the current configuration',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [configurationNameArg],
  async handler(flags, configurationName) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const app = await Application.get(ownerId, appId);
    ApplicationConfiguration.printValue(app, configurationName);
  },
});
