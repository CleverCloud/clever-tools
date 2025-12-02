import { undeploy as stopApplication } from '@clevercloud/client/esm/api/v2/application.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

export const stopCommand = defineCommand({
  description: 'Stop a running application',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await stopApplication({ id: ownerId, appId }).then(sendToApi);
    Logger.printSuccess('Application successfully stopped!');
  },
});
