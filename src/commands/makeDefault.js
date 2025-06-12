import * as AppConfig from '../models/app_configuration.js';
import { Logger } from '../logger.js';
import { styleText } from 'node:util';

export async function makeDefault (params) {
  const [alias] = params.args;

  await AppConfig.setDefault(alias);

  Logger.printSuccess(`The application ${styleText('green', alias)} has been set as default`);
};
