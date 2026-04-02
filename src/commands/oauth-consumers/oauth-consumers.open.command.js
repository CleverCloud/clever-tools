import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { resolveConsumer } from '../../models/oauth-consumer.js';
import * as Organisation from '../../models/organisation.js';
import * as User from '../../models/user.js';
import { openBrowser } from '../../models/utils.js';
import { orgaIdOrNameOption } from '../global.options.js';

export const oauthConsumersOpenCommand = defineCommand({
  description: 'Open the OAuth consumers page in the Clever Cloud Console',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string().optional(),
      description: 'OAuth consumer key or name (opens list page if omitted)',
      placeholder: 'consumer-key|consumer-name',
    }),
  ],
  async handler(options, keyOrName) {
    const { org } = options;

    if (keyOrName) {
      const { key, ownerId } = await resolveConsumer(keyOrName);
      await openBrowser(
        `/organisations/${ownerId}/oauth-consumers/${key}`,
        '🌐 Opening OAuth consumer in the Clever Cloud Console…',
      );
    } else {
      const ownerId = org != null ? await Organisation.getId(org) : await User.getCurrentId();
      await openBrowser(
        `/organisations/${ownerId}/oauth-consumers`,
        '🌐 Opening OAuth consumers in the Clever Cloud Console…',
      );
    }
  },
});
