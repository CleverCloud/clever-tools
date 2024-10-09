import * as AppConfig from '../models/app_configuration.js';
import { Logger } from '../logger.js';

export async function makeDefault (params) {
  const [alias] = params.args;

  await AppConfig.setDefault(alias);

  Logger.println(`The application ${alias} has been set as default`);
};
