import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';

export const configUpdateCommand = {
  name: 'update',
  description: 'Edit multiple configuration settings at once',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
      const options = ApplicationConfiguration.parseOptions(params.options);
    
      if (Object.keys(options).length === 0) {
        throw new Error('No configuration to update');
      }
    
      const app = await Application.updateOptions(ownerId, appId, options);
    
      ApplicationConfiguration.printAllValues(app);
  }
};
