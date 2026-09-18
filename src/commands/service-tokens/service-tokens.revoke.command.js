import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { deleteServiceToken, resolveServiceTokenId } from '../../models/service-token.js';
import * as User from '../../models/user.js';
import { orgaIdOrNameOption } from '../global.options.js';

export const serviceTokensRevokeCommand = defineCommand({
  description: 'Revoke a service token',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Service token ID or name',
      placeholder: 'token-id|token-name',
    }),
  ],
  async handler(options, tokenIdOrName) {
    const { org } = options;

    const orgaId = org != null ? await Organisation.getId(org) : await User.getCurrentId();
    const tokenId = await resolveServiceTokenId(orgaId, tokenIdOrName);
    await deleteServiceToken(orgaId, tokenId).then(sendToApi);

    Logger.printSuccess('Service token successfully revoked!');
  },
});
