import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as Domain from '../../models/domain.js';
import { openBrowser } from '../../models/utils.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const openCommand = defineCommand({
  description: 'Open an application in the Console',
  since: '0.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const favouriteDomain = await Domain.getFavouriteDomain({ ownerId, appId });

    if (favouriteDomain == null) {
      throw new Error("Couldn't find a domain name");
    }

    await openBrowser('https://' + favouriteDomain, 'Opening the application in the browser…');
  },
});
