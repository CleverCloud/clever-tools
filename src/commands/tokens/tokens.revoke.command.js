import { DeleteApiTokenCommand } from '@clevercloud/client/cc-api-bridge-commands/api-token/delete-api-token-command.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';

export const tokensRevokeCommand = defineCommand({
  description: 'Revoke an API token',
  since: '3.12.0',
  options: {},
  args: [
    defineArgument({
      schema: z.string(),
      description: 'API token ID',
      placeholder: 'api-token-id',
    }),
  ],
  async handler(_options, apiTokenId) {
    await clients.ccApiBridge.send(new DeleteApiTokenCommand({ apiTokenId }));

    Logger.println(styleText('green', '✔'), 'API token successfully revoked!');
  },
});
