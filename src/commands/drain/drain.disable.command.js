import { disableDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainDisableCommand = defineCommand({
  description: 'Disable a drain',
  since: '0.9.0',
  sinceDate: '2017-08-18',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, app: appIdOrName } = options;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    await disableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully disabled!`);
  },
});
