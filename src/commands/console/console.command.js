import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import { openBrowser } from '../../models/utils.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const consoleCommand = defineCommand({
  description: 'Open an application in the Console',
  since: '1.0.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;

    const { apps } = await AppConfig.loadApplicationConf();
    // If no app is linked or asked, open the Console without any context
    if (apps.length === 0 && !appIdOrName) {
      await openBrowser('/', 'Opening the Console in the browser…');
      return;
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const prefixPath = ownerId.startsWith('user_') ? 'users/me' : `organisations/${ownerId}`;
    const consolePath = `/${prefixPath}/applications/${appId}`;

    await openBrowser(consolePath, `Opening ${styleText('blue', appId)} in the browser…`);
  },
});
