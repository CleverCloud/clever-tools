import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import colors from 'colors/safe.js';

export async function link (params) {
  const [app] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  if (app.app_id != null && orgaIdOrName != null) {
    Logger.warn('You\'ve specified a unique application ID, organisation option will be ignored');
    await Application.linkRepo(app, null, alias);
  }
  else {
    await Application.linkRepo(app, orgaIdOrName, alias);
  }

  const linkedMessage = alias ? ` to local alias ${colors.green(alias)}` : '';
  Logger.printSuccess(`Application ${colors.green(app.app_name || app.app_id)} has been successfully linked${linkedMessage}!`);
}
