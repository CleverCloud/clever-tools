import { DeleteOauthConsumerCommand } from '@clevercloud/client/cc-api-commands/oauth-consumer/delete-oauth-consumer-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveOauthConsumer } from '../../models/oauth-consumer.js';
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

    await clients.ccApi.send(
      new DeleteOauthConsumerCommand({ ownerId: oauthConsumer.ownerId, oauthConsumerKey: oauthConsumer.key }),
    );
    Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], oauthConsumer.key)} has been deleted!`);
  },
});
