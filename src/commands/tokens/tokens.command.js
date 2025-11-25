import { colorOpt, updateNotifierOpt, verboseOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import dedent from 'dedent';
import { createApiToken, deleteApiToken, listApiTokens } from '../../clever-client/auth-bridge.js';
import { formatDate } from '../../lib/format-date.js';
import { promptSecret } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { conf } from '../../models/configuration.js';
import { sendToAuthBridge } from '../../models/send-to-api.js';
import { getCurrent as getCurrentUser } from '../../models/user.js';

export const tokensCommand = {
  name: 'tokens',
  description: 'Manage API tokens to query Clever Cloud API from ${...}',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute(params) {
    const { format } = params.options;
    
      const tokens = await listApiTokens().then(sendToAuthBridge);
    
      if (format === 'json') {
        Logger.printJson(tokens);
      } else {
        if (tokens.length === 0) {
          Logger.println(`ℹ️  No API token found, create one with ${styleText('blue', 'clever tokens create')} command`);
        } else {
          console.table(
            tokens.map((token) => {
              return {
                'API token ID': token.apiTokenId,
                Name: token.name,
                'Creation IP address': token.ip,
                Creation: formatDate(token.creationDate),
                Expiration: formatDate(token.expirationDate),
                State: token.state,
              };
            }),
          );
        }
      }
  }
};
