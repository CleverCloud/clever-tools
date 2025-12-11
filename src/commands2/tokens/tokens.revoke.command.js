import { z } from 'zod';
import { deleteApiToken } from '../../clever-client/auth-bridge.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToAuthBridge } from '../../models/send-to-api.js';

export const tokensRevokeCommand = defineCommand({
  description: 'Revoke an API token',
  since: '3.12.0',
  sinceDate: '2025-03-06',
  options: {},
  args: [
    defineArgument({
      schema: z.string(),
      description: 'API token ID',
      placeholder: 'api-token-id',
    }),
  ],
  async handler(_options, apiTokenId) {
    await deleteApiToken(apiTokenId).then(sendToAuthBridge);

    Logger.println(styleText('green', '✔'), 'API token successfully revoked!');
  },
});
