import { listApiTokens } from '../../clever-client/auth-bridge.js';
import { defineCommand } from '../../lib/define-command.js';
import { formatDate } from '../../lib/format-date.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToAuthBridge } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const tokensCommand = defineCommand({
  description: 'Manage API tokens to query Clever Cloud API from ${...}',
  since: '3.12.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

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
  },
});
