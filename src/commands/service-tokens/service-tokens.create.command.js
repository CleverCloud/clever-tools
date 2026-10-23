import dedent from 'dedent';
import { z } from 'zod';
import { formatDate } from '../../lib/date-utils.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { selectAnswer } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { createServiceToken } from '../../models/service-token.js';
import * as User from '../../models/user.js';
import { futureDateOrDuration } from '../../parsers.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

const SERVICE_TOKEN_ROLES = ['Admin', 'Manager', 'Developer', 'Accounting'];

export const serviceTokensCreateCommand = defineCommand({
  description: 'Create a service token for an organisation',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    role: defineOption({
      name: 'role',
      schema: z.enum(SERVICE_TOKEN_ROLES).optional(),
      description: 'Role assigned to the service token (Admin, Manager, Developer, Accounting)',
      aliases: ['r'],
      placeholder: 'role',
    }),
    resources: defineOption({
      name: 'resources',
      schema: z
        .string()
        .transform((v) => v.split(','))
        .optional(),
      description: 'Scope token to specific resources by app ID, add-on ID, or real ID (comma-separated)',
      placeholder: 'id1,id2,...',
    }),
    description: defineOption({
      name: 'description',
      schema: z.string().optional(),
      description: 'Service token description',
      aliases: ['d'],
      placeholder: 'description',
    }),
    expiration: defineOption({
      name: 'expiration',
      schema: z.string().default('90d').transform(futureDateOrDuration),
      description: 'Duration until token expiration (e.g.: 1h, 4d, 2w, 6M, 1y)',
      aliases: ['e'],
      placeholder: 'expiration',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Service token name',
      placeholder: 'token-name',
    }),
  ],
  async handler(options, tokenName) {
    const { org, description, resources, expiration, format } = options;
    let { role } = options;

    if (role == null) {
      const roleChoices = SERVICE_TOKEN_ROLES.map((r) => ({
        name: r,
        value: r,
      }));
      role = await selectAnswer('Select a role for the service token:', roleChoices);
    }

    const orgaId = org != null ? await Organisation.getId(org) : await User.getCurrentId();
    const ttlSeconds = Math.max(1, Math.floor((expiration.getTime() - Date.now()) / 1000));

    const body = {
      name: tokenName,
      role: role.toUpperCase(),
      // eslint-disable-next-line camelcase
      ttl_seconds: ttlSeconds,
      ...(description != null && { description }),
      ...(resources != null && { resources }),
    };

    const response = await createServiceToken(orgaId, body)
      .then(sendToApi)
      .catch((error) => {
        const fields = error?.responseBody?.fields;
        if (fields != null) {
          const details = Object.entries(fields)
            .map(([key, msg]) => `${key.replace('serviceToken.', '')}: ${msg}`)
            .join(', ');
          throw new Error(details);
        }
        throw error;
      });

    switch (format) {
      case 'json':
        Logger.printJson(response);
        break;
      case 'human':
      default: {
        const revokeCmd =
          org != null
            ? `clever service-tokens revoke ${response.metadata.id} --org ${orgaId}`
            : `clever service-tokens revoke ${response.metadata.id}`;

        const firstResource = resources?.[0];
        let curlPath;
        if (firstResource == null) {
          curlPath = `/v2/organisations/${orgaId}/applications`;
        } else if (firstResource.startsWith('app_')) {
          curlPath = `/v2/organisations/${orgaId}/applications/${firstResource}`;
        } else {
          curlPath = `/v2/organisations/${orgaId}/addons/${firstResource}`;
        }

        Logger.println(dedent`
            ${styleText('green', '✔')} Service token successfully created! Store it securely, you won't be able to print it again.

              - Token ID    : ${styleText('grey', response.metadata.id)}
              - Token       : ${styleText('grey', response.token)}
              - Role        : ${styleText('grey', role)}
              - Expiration  : ${styleText('grey', formatDate(response.metadata.expiredAt))}

            Export this token and use it to make authenticated requests to the Clever Cloud API:

            export CC_SERVICE_TOKEN=${response.token}
            curl -H "Authorization: Bearer $CC_SERVICE_TOKEN" https://api.clever-cloud.com${curlPath}

            Then, to revoke this token, run:
            ${revokeCmd}
          `);
      }
    }
  },
});
