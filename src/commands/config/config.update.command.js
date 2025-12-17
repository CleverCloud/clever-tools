import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const configUpdateCommand = defineCommand({
  description: 'Edit multiple configuration settings at once',
  since: '2.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const newOptions = ApplicationConfiguration.parseOptions(options);

    if (Object.keys(newOptions).length === 0) {
      throw new Error('No configuration to update');
    }

    const app = await Application.updateOptions(ownerId, appId, newOptions);

    ApplicationConfiguration.printAllValues(app);
  },
});
