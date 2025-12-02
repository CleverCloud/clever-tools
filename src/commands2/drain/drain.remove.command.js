import { deleteDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { drainIdArg } from './drain.args.js';

export const drainRemoveCommand = defineCommand({
  description: 'Remove a drain',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [drainIdArg],
  async handler(flags, drainId) {
    const { alias, app: appIdOrName } = flags;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    await deleteDrain({ ownerId, applicationId, drainId }).then(sendToApi);
    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully removed!`);
  },
});
