import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainUrlArg } from './drain.args.js';
import { drainSdParamsOption } from './drain.options.js';

export const drainCreateOvhTcpCommand = defineCommand({
  description: 'Create an OVH TCP drain',
  since: '0.9.0',
  options: {
    rfc5424StructuredDataParameters: drainSdParamsOption,
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainUrlArg],
  async handler(options, url) {
    const { alias, appIdOrName, addonIdOrRealId, rfc5424StructuredDataParameters } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await createLogDrain('OVH_TCP', ownerId, resourceId, url, { rfc5424StructuredDataParameters });

    Logger.printSuccess(
      `OVH TCP drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
