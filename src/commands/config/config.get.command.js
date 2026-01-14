import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { configurationNameArg } from './config.args.js';

export const configGetCommand = defineCommand({
  description: 'Display the current configuration',
  since: '2.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [configurationNameArg],
  async handler(options, configurationName) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const app = await Application.get(ownerId, appId);
    ApplicationConfiguration.printValue(app, configurationName);
  },
});
