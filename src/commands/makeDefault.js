import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as AppConfig from '../models/app_configuration.js';

export async function makeDefault(_options, alias) {
  await AppConfig.setDefault(alias);

  Logger.printSuccess(`The application ${styleText('green', alias)} has been set as default`);
}
