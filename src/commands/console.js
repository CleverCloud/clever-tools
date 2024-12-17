import * as Application from '../models/application.js';
import * as AppConfig from '../models/app_configuration.js';
import { Logger } from '../logger.js';
import openPage from 'open';
import { conf } from '../models/configuration.js';

export async function openConsole (params) {
  const { alias, app: appIdOrName } = params.options;

  const { apps } = await AppConfig.loadApplicationConf();
  // If no app is linked or asked, open the Console without any context
  if (apps.length === 0 && !appIdOrName) {
    Logger.println('Opening the Console in your browser');
    await openPage(conf.CONSOLE_URL, { wait: false });
    return;
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const prefixPath = (ownerId.startsWith('user_')) ? 'users/me' : `organisations/${ownerId}`;
  const url = `${conf.CONSOLE_URL}/${prefixPath}/applications/${appId}`;

  Logger.debug(`URL: ${url}`);
  Logger.println(`Opening the Console in your browser for application ${appId}`);

  await openPage(url, { wait: false });
}
