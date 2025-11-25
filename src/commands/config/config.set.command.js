import { configurationNameArg } from './config.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';

export const configSetCommand = {
  name: 'set',
  description: 'Edit one configuration setting',
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
    {
      name: 'configuration-value',
      description: 'The new value of the configuration',
      parser: null,
      complete: null
    },
    configurationNameArg,
  ],
  async execute(params) {
    const [configurationName, configurationValue] = params.args;
      const { alias, app: appIdOrName } = params.options;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
      const config = ApplicationConfiguration.getById(configurationName);
      const options = {
        [config.name]: ApplicationConfiguration.parse(config, configurationValue),
      };
      const app = await Application.updateOptions(ownerId, appId, options);
      Logger.printSuccess(
        `Config ${styleText('green', config.id)} successfully updated to ${styleText('green', ApplicationConfiguration.formatValue(config, app[config.name]).toString())}!`,
      );
  }
};
