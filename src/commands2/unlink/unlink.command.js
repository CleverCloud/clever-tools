import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import { aliasArg } from '../global.args.js';

export const unlinkCommand = defineCommand({
  description: 'Unlink this repo from an existing application',
  since: '0.2.0',
  sinceDate: '2015-07-28',
  options: {},
  args: [aliasArg],
  async handler(_options, alias) {
    const app = await AppConfig.getAppDetails({ alias });

    await Application.unlinkRepo(app.alias);
    Logger.printSuccess(
      `Application ${styleText('green', app.appId)} has been successfully unlinked from local alias ${styleText('green', app.alias)}!`,
    );
  },
});
