import { ListApiTokenCommand } from '@clevercloud/client/cc-api-bridge-commands/api-token/list-api-token-command.js';
import { config } from '../../config/config.js';
import { toLegacyApiToken } from '../../legacy-json/api-token.legacy.js';
import { formatDate } from '../../lib/date-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const tokensCommand = defineCommand({
  description: `Manage API tokens to query Clever Cloud API from ${config.AUTH_BRIDGE_HOST}`,
  since: '3.12.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

    const tokens = await clients.ccApiBridge.send(new ListApiTokenCommand());

    if (format === 'json') {
      Logger.printJson(tokens.map(toLegacyApiToken));
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
              Creation: formatDate(token.createdAt),
              Expiration: formatDate(token.expiresAt),
              State: token.state,
            };
          }),
        );
      }
    }
  },
});
