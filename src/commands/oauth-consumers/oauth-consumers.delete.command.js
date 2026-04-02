import { remove } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { resolveConsumer } from '../../models/oauth-consumer.js';
import { sendToApi } from '../../models/send-to-api.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';

export const oauthConsumersDeleteCommand = defineCommand({
  description: 'Delete an OAuth consumer',
  since: '4.8.0',
  options: {
    yes: defineOption({
      name: 'yes',
      schema: z.boolean().default(false),
      description: 'Skip confirmation and delete the OAuth consumer directly',
      aliases: ['y'],
    }),
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { yes: skipConfirmation } = options;

    const { key, ownerId } = await resolveConsumer(keyOrName);

    if (!skipConfirmation) {
      await confirm(
        `Are you sure you want to delete the OAuth consumer ${styleText('blue', key)}?`,
        'OAuth consumer deletion cancelled.',
      );
    }

    await remove({ id: ownerId, key }).then(sendToApi);
    Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], key)} has been deleted!`);
  },
});
