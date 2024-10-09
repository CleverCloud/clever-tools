import * as Application from '../models/application.js';
import { Logger } from '../logger.js';

export async function link (params) {
  const [app] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  if (app.app_id != null && orgaIdOrName != null) {
    Logger.warn('You\'ve specified a unique application ID, organisation option will be ignored');
  }

  await Application.linkRepo(app, orgaIdOrName, alias);

  Logger.println('Your application has been successfully linked!');
}
