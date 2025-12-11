import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const configCommand = defineCommand({
  description: 'Display or edit the configuration of your application',
  since: '2.5.0',
  sinceDate: '2020-05-26',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const app = await Application.get(ownerId, appId);
    ApplicationConfiguration.printAllValues(app);
  },
});
