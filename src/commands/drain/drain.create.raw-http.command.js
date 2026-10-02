import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainUrlArg } from './drain.args.js';
import { drainKindOption, drainPasswordOption, drainUsernameOption } from './drain.options.js';

export const drainCreateRawHttpCommand = defineCommand({
  description: 'Create a raw HTTP drain',
  since: '0.9.0',
  options: {
    username: drainUsernameOption,
    password: drainPasswordOption,
    kind: drainKindOption,
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainUrlArg],
  async handler(options, url) {
    const { kind, alias, appIdOrName, addonIdOrRealId, username, password } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await createLogDrain('RAW_HTTP', kind, ownerId, resourceId, url, { username, password });

    Logger.printSuccess(
      `Raw HTTP drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
