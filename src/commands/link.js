import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';

export async function link(options, app) {
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
}
