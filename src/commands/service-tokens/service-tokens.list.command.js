import { formatDate } from '../../lib/date-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { listServiceTokens } from '../../models/service-token.js';
import * as User from '../../models/user.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const serviceTokensListCommand = defineCommand({
  description: 'List service tokens for an organisation',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, format } = options;

    const orgaId = org != null ? await Organisation.getId(org) : await User.getCurrentId();
    const tokens = await listServiceTokens(orgaId).then(sendToApi);

    if (format === 'json') {
      Logger.printJson(tokens);
    } else {
      if (tokens.length === 0) {
        Logger.println(
          `No service token found, create one with ${styleText('blue', 'clever service-tokens create')} command`,
        );
      } else {
        console.table(
          tokens.map((token) => {
            return {
              'Token ID': token.id,
              Name: token.name,
              Status: token.status,
              Created: formatDate(token.createdAt),
              Expires: formatDate(token.expiredAt),
            };
          }),
        );
      }
    }
  },
});
