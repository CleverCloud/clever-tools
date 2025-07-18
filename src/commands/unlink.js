import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import colors from 'colors/safe.js';

export async function unlink (params) {
  const [alias] = params.args;
  const app = await AppConfig.getAppDetails({ alias });

  await Application.unlinkRepo(app.alias);
  Logger.printSuccess(`Application ${colors.green(app.appId)} has been successfully unlinked from local alias ${colors.green(app.alias)}!`);
};
