import { z } from 'zod';
import { formatDate } from '../../lib/date-utils.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { getServiceTokenById, resolveServiceTokenId } from '../../models/service-token.js';
import * as User from '../../models/user.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const serviceTokensGetCommand = defineCommand({
  description: 'Get details about a service token',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Service token ID or name',
      placeholder: 'token-id|token-name',
    }),
  ],
  async handler(options, tokenIdOrName) {
    const { org, format } = options;

    const orgaId = org != null ? await Organisation.getId(org) : await User.getCurrentId();
    const tokenId = await resolveServiceTokenId(orgaId, tokenIdOrName);
    const token = await getServiceTokenById(orgaId, tokenId).then(sendToApi);

    if (format === 'json') {
      Logger.printJson(token);
    } else {
      console.table({
        'Token ID': token.id,
        Name: token.name,
        Description: token.description ?? '',
        Status: token.status,
        Created: formatDate(token.createdAt),
        Expires: formatDate(token.expiredAt),
        ...(token.revokedAt != null && { Revoked: formatDate(token.revokedAt) }),
      });
    }
  },
});
