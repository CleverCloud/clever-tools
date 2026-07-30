import { DeleteLogDrainCommand } from '@clevercloud/client/cc-api-commands/log-drain/delete-log-drain-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainRemoveCommand = defineCommand({
  description: 'Remove a drain',
  since: '0.9.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, appIdOrName, addonIdOrRealId } = options;
    const resource = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    await clients.ccApi.send(new DeleteLogDrainCommand({ ...resource, drainId }));
    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully removed!`);
  },
});
