import { getDrainTestCommand } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainTestCommandCommand = defineCommand({
  description: 'Get a ready-to-execute shell command to test a drain recipient',
  since: '4.8.0',
  options: {
    app: appIdOrNameOption,
    alias: aliasOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { app: appIdOrName, alias } = options;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    const testCommand = await getDrainTestCommand({ ownerId, applicationId, drainId }).then(sendToApi);

    Logger.println(testCommand);
  },
});
