import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { appIdOrNameArg } from '../global.args.js';
import { aliasCreationOption, orgaIdOrNameOption } from '../global.options.js';

export const linkCommand = defineCommand({
  description: 'Link this repo to an existing application',
  since: '0.2.0',
  sinceDate: '2015-07-28',
  options: {
    alias: aliasCreationOption,
    org: orgaIdOrNameOption,
  },
  args: [appIdOrNameArg],
  async handler(options, app) {
    const { org: orgaIdOrName, alias } = options;

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
});
