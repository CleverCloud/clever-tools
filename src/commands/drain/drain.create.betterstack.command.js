import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainUrlArg } from './drain.args.js';

export const drainCreateBetterstackCommand = defineCommand({
  description: 'Create a Better Stack drain',
  since: '4.11.0',
  options: {
    sourceToken: defineOption({
      name: 'source-token',
      schema: z.string().min(1),
      description: 'Source token',
      aliases: ['t'],
      placeholder: 'source-token',
    }),
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainUrlArg],
  async handler(options, url) {
    const { alias, appIdOrName, addonIdOrRealId, sourceToken } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await createLogDrain('BETTERSTACK', ownerId, resourceId, url, { sourceToken });

    Logger.printSuccess(
      `Better Stack drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
