import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import { aliasArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const unlinkCommand = {
  name: 'unlink',
  description: 'Unlink this repo from an existing application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [aliasArg],
  async execute(params) {
    const [alias] = params.args;
    const app = await AppConfig.getAppDetails({ alias });

    await Application.unlinkRepo(app.alias);
    Logger.printSuccess(
      `Application ${styleText('green', app.appId)} has been successfully unlinked from local alias ${styleText('green', app.alias)}!`,
    );
  },
};
