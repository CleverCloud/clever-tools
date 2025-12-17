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

    const vhost = await Domain.getBest(appId, ownerId);
    const url = 'https://' + vhost.fqdn;

    await openBrowser(url, 'Opening the application in your browser');
  },
});
