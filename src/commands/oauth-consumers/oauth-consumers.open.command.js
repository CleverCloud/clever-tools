import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { resolveOauthConsumer } from '../../models/oauth-consumer.js';
import { openBrowser } from '../../models/utils.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';

export const oauthConsumersOpenCommand = defineCommand({
  description: 'Open an OAuth consumer in the Clever Cloud Console',
  since: 'unreleased',
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const oauthConsumer = await resolveOauthConsumer(keyOrName);
    await openBrowser(
      `/organisations/${oauthConsumer.ownerId}/oauth-consumers/${oauthConsumer.key}`,
      `Opening OAuth consumer ${styleText('blue', oauthConsumer.key)} in the browser…`,
    );
  },
});
