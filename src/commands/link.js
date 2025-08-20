import * as AppConfig from '../models/app_configuration.js';
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

  const { apps } = await AppConfig.loadApplicationConf();
  const attributedAlias = apps.find((a) => a.app_id === app.app_id)?.alias;

  Logger.printSuccess(`Application has been successfully linked to local alias ${colors.green(attributedAlias)}!`);
}
