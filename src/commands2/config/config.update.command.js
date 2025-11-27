import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const configUpdateCommand = defineCommand({
  description: 'Edit multiple configuration settings at once',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const options = ApplicationConfiguration.parseOptions(flags);

    if (Object.keys(options).length === 0) {
      throw new Error('No configuration to update');
    }

    const app = await Application.updateOptions(ownerId, appId, options);

    ApplicationConfiguration.printAllValues(app);
  },
});
