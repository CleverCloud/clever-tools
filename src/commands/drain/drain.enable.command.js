import { enableDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainEnableCommand = defineCommand({
  description: 'Enable a drain',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, app: appIdOrName } = options;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    await enableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully enabled!`);
  },
});
