import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainPasswordOption, drainUsernameOption } from './drain.options.js';

export const drainCreateElasticsearchCommand = defineCommand({
  description: 'Create an Elasticsearch drain',
  since: '0.9.0',
  options: {
    index: defineOption({
      name: 'index-prefix',
      schema: z.string().min(1),
      description: 'Index prefix',
      aliases: ['i'],
      placeholder: 'index-prefix',
    }),
    username: drainUsernameOption,
    password: drainPasswordOption,
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [
    defineArgument({
      // Elasticsearch drains target the bulk API
      schema: z.string().refine((url) => url.endsWith('/_bulk'), {
        message: "elasticsearch drain URL must end with '/_bulk'",
      }),
      description: 'Drain URL',
      placeholder: 'drain-url',
    }),
  ],
  async handler(options, url) {
    const { alias, appIdOrName, addonIdOrRealId, index, username, password } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await createLogDrain('ELASTICSEARCH', ownerId, resourceId, url, { index, username, password });

    Logger.printSuccess(
      `Elasticsearch drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
