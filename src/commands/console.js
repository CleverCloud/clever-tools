import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import { openBrowser } from '../models/utils.js';

export async function openConsole(params) {
  const { alias, app: appIdOrName } = params.options;

  const { apps } = await AppConfig.loadApplicationConf();
  // If no app is linked or asked, open the Console without any context
  if (apps.length === 0 && !appIdOrName) {
    await openBrowser('/', 'Opening the Console in your browser');
    return;
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const prefixPath = ownerId.startsWith('user_') ? 'users/me' : `organisations/${ownerId}`;
  const consolePath = `/${prefixPath}/applications/${appId}`;

  await openBrowser(consolePath, `Opening the Console in your browser for application ${appId}`);
}
