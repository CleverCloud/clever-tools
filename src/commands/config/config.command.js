import { defineCommand } from '../../lib/define-command.js';
import * as ApplicationConfig from '../../models/application-config.js';
import * as Application from '../../models/application.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const configCommand = defineCommand({
  description: 'Display or edit the configuration of your application',
  since: '2.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const app = await Application.get(ownerId, appId);
    ApplicationConfig.printAllValues(app);
  },
});
