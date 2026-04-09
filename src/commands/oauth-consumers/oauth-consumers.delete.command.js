import { remove } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { defineCommand } from '../../lib/define-command.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { resolveOauthConsumer } from '../../models/oauth-consumer.js';
import { sendToApi } from '../../models/send-to-api.js';
import { skipConfirmationOption } from '../global.options.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';

export const oauthConsumersDeleteCommand = defineCommand({
  description: 'Delete an OAuth consumer',
  since: '4.8.0',
  options: {
    skipConfirmation: skipConfirmationOption,
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { skipConfirmation } = options;

    const oauthConsumer = await resolveOauthConsumer(keyOrName);

    if (!skipConfirmation) {
      await confirm(
        `Are you sure you want to delete the OAuth consumer ${styleText('blue', oauthConsumer.key)}?`,
        'OAuth consumer deletion cancelled.',
      );
    }

    await remove({ id: oauthConsumer.ownerId, key: oauthConsumer.key }).then(sendToApi);
    Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], oauthConsumer.key)} has been deleted!`);
  },
});
