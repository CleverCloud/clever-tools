import dedent from 'dedent';
import { z } from 'zod';
import { createApiToken } from '../../clever-client/auth-bridge.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { formatDate } from '../../lib/format-date.js';
import { promptSecret } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { conf } from '../../models/configuration.js';
import { sendToAuthBridge } from '../../models/send-to-api.js';
import { getCurrent as getCurrentUser } from '../../models/user.js';
import { futureDateOrDuration } from '../../parsers.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const tokensCreateCommand = defineCommand({
  description: 'Create an API token',
  since: '3.12.0',
  sinceDate: '2025-03-06',
  options: {
    expiration: defineOption({
      name: 'expiration',
      schema: z.string().transform(futureDateOrDuration).optional(),
      description: 'Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y',
      aliases: ['e'],
      placeholder: 'expiration',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'API token name',
      placeholder: 'api-token-name',
    }),
  ],
  async handler(options, apiTokenName) {
    const { expiration, format } = options;
    const user = await getCurrentUser();

    if (!user.hasPassword) {
      const apiTokenListHref = new URL('/users/me/api-tokens', conf.CONSOLE_URL).href;
      throw new Error(dedent`
          ${styleText('yellow', '!')} Your Clever Cloud account is linked via GitHub and has no password. Setting one is required to create API tokens.
          ${styleText('blue', '→')} To do so, go to the following URL: ${styleText('blue', apiTokenListHref)}
        `);
    }

    // Expire in 1 year
    const dateObject = new Date();
    dateObject.setFullYear(dateObject.getFullYear() + 1);
    const maxExpirationDate = dateObject;

    let expirationDate;
    if (expiration != null) {
      if (expiration > maxExpirationDate.getTime()) {
        throw new Error('You cannot set an expiration date greater than 1 year');
      }
      expirationDate = new Date(expiration);
    } else {
      expirationDate = maxExpirationDate;
    }

    const password = await promptSecret('Enter your password:');

    let mfaCode;
    if (user.preferredMFA === 'TOTP') {
      mfaCode = await promptSecret('Enter your 2FA code:');
    }

    const tokenData = {
      email: user.email,
      password,
      mfaCode,
      name: apiTokenName,
      expirationDate: expirationDate.toISOString(),
    };
    const createdToken = await createApiToken(tokenData)
      .then(sendToAuthBridge)
      .catch((error) => {
        const errorCode = error?.cause?.responseBody?.code;
        if (errorCode === 'invalid-credential') {
          throw new Error('Invalid credentials, check your password');
        }
        if (errorCode === 'invalid-mfa-code') {
          throw new Error('Invalid credentials, check your 2FA code');
        }
        throw error;
      });

    switch (format) {
      case 'json':
        Logger.printJson(createdToken);
        break;
      case 'human':
      default:
        Logger.println(dedent`
            ${styleText('green', '✔')} API token successfully created! Store it securely, you won't able to print it again.
    
              - API token ID : ${styleText('grey', createdToken.apiTokenId)}
              - API token    : ${styleText('grey', createdToken.apiToken)}
              - Expiration   : ${styleText('grey', formatDate(createdToken.expirationDate))}
    
            Export this token and use it to make authenticated requests to the Clever Cloud API through the Auth Bridge:
    
            export CC_API_TOKEN=${createdToken.apiToken}
            curl -H "Authorization: Bearer $CC_API_TOKEN" ${conf.AUTH_BRIDGE_HOST}/v2/self
    
            Then, to revoke this token, run:
            clever tokens revoke ${createdToken.apiTokenId}
          `);
    }
  },
});
