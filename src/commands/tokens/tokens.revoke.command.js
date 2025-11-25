import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import dedent from 'dedent';
import { createApiToken, deleteApiToken, listApiTokens } from '../../clever-client/auth-bridge.js';
import { formatDate } from '../../lib/format-date.js';
import { promptSecret } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { conf } from '../../models/configuration.js';
import { sendToAuthBridge } from '../../models/send-to-api.js';
import { getCurrent as getCurrentUser } from '../../models/user.js';

export const tokensRevokeCommand = {
  name: 'revoke',
  description: 'Revoke an API token',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    {
      name: 'api-token-id',
      description: 'API token ID',
      parser: null,
      complete: null
    },
  ],
  async execute(params) {
    const [apiTokenId] = params.args;
    
      await deleteApiToken(apiTokenId).then(sendToAuthBridge);
    
      Logger.println(styleText('green', '✔'), 'API token successfully revoked!');
  }
};
