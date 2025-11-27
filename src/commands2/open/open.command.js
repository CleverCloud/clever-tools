import { defineCommand } from '../../lib/define-command.js';
import * as Application from '../../models/application.js';
import * as Domain from '../../models/domain.js';
import { openBrowser } from '../../models/utils.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const openCommand = defineCommand({
  description: 'Open an application in the Console',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const vhost = await Domain.getBest(appId, ownerId);
    const url = 'https://' + vhost.fqdn;

    await openBrowser(url, 'Opening the application in your browser');
  },
});
