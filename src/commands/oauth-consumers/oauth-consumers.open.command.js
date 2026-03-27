import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import * as Organisation from '../../models/organisation.js';
import * as User from '../../models/user.js';
import { openBrowser } from '../../models/utils.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { resolveConsumerKey } from './oauth-consumers.args.js';

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

    const ownerId = org != null ? await Organisation.getId(org) : await User.getCurrentId();
    let consolePath = `/organisations/${ownerId}/oauth-consumers`;

    if (keyOrName) {
      const key = await resolveConsumerKey(keyOrName, org);
      consolePath += `/${key}`;
    }

    await openBrowser(consolePath, '🌐 Opening OAuth consumers in the Clever Cloud Console…');
  },
});
