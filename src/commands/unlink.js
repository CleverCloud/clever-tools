import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import { Logger } from '../logger.js';

export async function unlink (params) {
  const [alias] = params.args;
  const app = await AppConfig.getAppDetails({ alias });

  await Application.unlinkRepo(app.alias);
  Logger.println('Your application has been successfully unlinked!');
};
