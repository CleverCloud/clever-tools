import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const configCommand = {
  name: 'config',
  description: 'Display or edit the configuration of your application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const app = await Application.get(ownerId, appId);
    ApplicationConfiguration.printAllValues(app);
  },
};
