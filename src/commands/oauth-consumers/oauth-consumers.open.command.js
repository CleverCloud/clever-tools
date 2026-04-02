import { defineCommand } from '../../lib/define-command.js';
import { resolveConsumer } from '../../models/oauth-consumer.js';
import { openBrowser } from '../../models/utils.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';

export const oauthConsumersOpenCommand = defineCommand({
  description: 'Open an OAuth consumer in the Clever Cloud Console',
  since: '4.8.0',
  options: {},
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { key, ownerId } = await resolveConsumer(keyOrName);
    await openBrowser(
      `/organisations/${ownerId}/oauth-consumers/${key}`,
      '🌐 Opening OAuth consumer in the Clever Cloud Console…',
    );
  },
});
