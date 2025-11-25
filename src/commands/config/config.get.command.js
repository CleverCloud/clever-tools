import { configurationNameArg } from './config.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';

export const configGetCommand = {
  name: 'get',
  description: 'Display the current configuration',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    configurationNameArg,
  ],
  async execute(params) {
    const [configurationName] = params.args;
      const { alias, app: appIdOrName } = params.options;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
      const app = await Application.get(ownerId, appId);
      ApplicationConfiguration.printValue(app, configurationName);
  }
};
