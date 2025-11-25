import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { appIdOrNameArg } from '../global.args.js';
import { aliasCreationOpt, colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const linkCommand = {
  name: 'link',
  description: 'Link this repo to an existing application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasCreationOpt,
    org: orgaIdOrNameOpt,
  },
  args: [appIdOrNameArg],
  async execute(params) {
    const [app] = params.args;
    const { org: orgaIdOrName, alias } = params.options;

    let appConfigEntry;
    if (app.app_id != null && orgaIdOrName != null) {
      Logger.warn("You've specified a unique application ID, organisation option will be ignored");
      appConfigEntry = await Application.linkRepo(app, null, alias);
    } else {
      appConfigEntry = await Application.linkRepo(app, orgaIdOrName, alias);
    }

    Logger.printSuccess(
      `Application ${styleText('green', appConfigEntry.app_id)} has been successfully linked to local alias ${styleText('green', appConfigEntry.alias)}!`,
    );
  },
};
