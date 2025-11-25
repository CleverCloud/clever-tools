import { aliasArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';

export const makeDefaultCommand = {
  name: 'make-default',
  description: 'Make a linked application the default one',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    aliasArg,
  ],
  async execute(params) {
    const [alias] = params.args;
    
      await AppConfig.setDefault(alias);
    
      Logger.printSuccess(`The application ${styleText('green', alias)} has been set as default`);
  }
};
