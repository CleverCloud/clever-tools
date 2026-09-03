import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainUrlArg } from './drain.args.js';

export const drainCreateNewrelicCommand = defineCommand({
  description: 'Create a New Relic drain',
  since: '0.9.0',
  options: {
    apiKey: defineOption({
      name: 'api-key',
      schema: z.string().min(1),
      description: 'API key',
      aliases: ['k'],
      placeholder: 'api-key',
    }),
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainUrlArg],
  async handler(options, url) {
    const { alias, appIdOrName, addonIdOrRealId, apiKey } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await createLogDrain('NEWRELIC', ownerId, resourceId, url, { apiKey });

    Logger.printSuccess(
      `New Relic drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
