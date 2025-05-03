import * as AppConfig from '../models/app_configuration.js';
import { Logger } from '../logger.js';
import colors from 'colors/safe.js';
export async function makeDefault (params) {
  const [alias] = params.args;

  await AppConfig.setDefault(alias);

  Logger.println(colors.bold.green('✓'), `The application ${colors.green(alias)} has been set as default`);
};
