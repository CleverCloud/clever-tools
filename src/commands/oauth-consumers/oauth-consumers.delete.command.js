import { remove } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { consumerKeyOrNameArg, resolveConsumerKey } from './oauth-consumers.args.js';

export const oauthConsumersDeleteCommand = defineCommand({
  description: 'Delete an OAuth consumer',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    yes: defineOption({
      name: 'yes',
      schema: z.boolean().default(false),
      description: 'Skip confirmation and delete the OAuth consumer directly',
      aliases: ['y'],
    }),
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { org, yes: skipConfirmation } = options;

    const key = await resolveConsumerKey(keyOrName, org);

    if (!skipConfirmation) {
      await confirm(
        `Are you sure you want to delete the OAuth consumer ${styleText('blue', key)}?`,
        'OAuth consumer deletion cancelled.',
      );
    }

    const id = org != null ? await Organisation.getId(org) : null;
    await remove({ id, key }).then(sendToApi);
    Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], key)} has been deleted!`);
  },
});
