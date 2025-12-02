import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';

export async function unlink(_flags, alias) {
  const app = await AppConfig.getAppDetails({ alias });

  await Application.unlinkRepo(app.alias);
  Logger.printSuccess(
    `Application ${styleText('green', app.appId)} has been successfully unlinked from local alias ${styleText('green', app.alias)}!`,
  );
}
