import { Logger } from '../logger.js';
import { conf, writeOAuthConf } from '../models/configuration.js';

export async function logout () {
  // write empty object
  await writeOAuthConf({});
  Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
}
