import { disableDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { resolveDrainResourceFromOptions } from '../../models/drain.resource-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, resourceIdOrNameOption } from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainDisableCommand = defineCommand({
  description: 'Disable a drain',
  since: '0.9.0',
  options: {
    resource: resourceIdOrNameOption,
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { resource: resourceIdOrName, alias, app: appIdOrName } = options;

    const { ownerId, resourceId } = await resolveDrainResourceFromOptions(resourceIdOrName, appIdOrName, alias);

    await disableDrain({ ownerId, resourceId, drainId }).then(sendToApi);

    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully disabled!`);
  },
});
