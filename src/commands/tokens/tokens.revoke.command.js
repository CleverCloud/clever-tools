import { deleteApiToken } from '../../clever-client/auth-bridge.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToAuthBridge } from '../../models/send-to-api.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const tokensRevokeCommand = defineCommand({
  name: 'revoke',
  description: 'Revoke an API token',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [
    defineArgument({
      name: 'api-token-id',
      description: 'API token ID',
      parser: null,
      complete: null,
    }),
  ],
  async execute(params) {
    const [apiTokenId] = params.args;

    await deleteApiToken(apiTokenId).then(sendToAuthBridge);

    Logger.println(styleText('green', '✔'), 'API token successfully revoked!');
  },
});
