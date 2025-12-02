import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const configCommand = defineCommand({
  description: 'Display or edit the configuration of your application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const app = await Application.get(ownerId, appId);
    ApplicationConfiguration.printAllValues(app);
  },
});
